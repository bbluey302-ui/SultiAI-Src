#!/usr/bin/env python3
"""
Export the base encoder of google-bert/bert-base-multilingual-cased to ONNX.

Why this script exists
----------------------
Transformers.js can run ONNX models in Node, but the public ONNX repos for this
checkpoint expose the *masked-language-model* graph (output: `logits`), not the
base encoder (`last_hidden_state`). SultiAI needs the 768-dimensional contextual
hidden states, so we export the base `BertModel` ourselves and quantize it to
int8 for CPU inference.

This is a one-time build step. The runtime only needs:
  - onnx/model_quantized.onnx
  - tokenizer.json / tokenizer_config.json / vocab.txt
  - config.json (architectures = ["BertModel"])

Usage:
  python server/scripts/export-bert-onnx.py
  python server/scripts/export-bert-onnx.py --force
  python server/scripts/export-bert-onnx.py --output models/bert/sulti-bert-base-multilingual-cased

The script never reads or prints secrets. The source model is public.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import shutil
import sys
import time
from pathlib import Path

DEFAULT_MODEL_ID = "google-bert/bert-base-multilingual-cased"
DEFAULT_OUTPUT = Path("models/bert/sulti-bert-base-multilingual-cased")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_env_file(path: Path = Path(".env")) -> None:
    """Load HF_TOKEN (and friends) for rate limits without printing secrets."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


def cosine(a, b) -> float:
    import numpy as np

    a = np.asarray(a, dtype=np.float64).reshape(-1)
    b = np.asarray(b, dtype=np.float64).reshape(-1)
    denominator = (np.linalg.norm(a) * np.linalg.norm(b)) or 1.0
    return float(np.dot(a, b) / denominator)


def mean_pool(hidden, mask):
    import numpy as np

    hidden = np.asarray(hidden, dtype=np.float64)
    mask = np.asarray(mask, dtype=np.float64)
    weights = mask[..., None]
    return (hidden * weights).sum(axis=1) / np.clip(weights.sum(axis=1), 1e-9, None)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--force", action="store_true")
    parser.add_argument(
        "--drop-fp32",
        action="store_true",
        help="Delete the fp32 graph after export (not recommended; fp32 is the default runtime graph).",
    )
    args = parser.parse_args()

    output = Path(args.output)
    onnx_dir = output / "onnx"
    quantized_path = onnx_dir / "model_quantized.onnx"
    fp32_path = onnx_dir / "model.onnx"

    if fp32_path.exists() and quantized_path.exists() and not args.force:
        print(f"[bert-export] already present: {fp32_path}")
        print(f"[bert-export] already present: {quantized_path}")
        print("[bert-export] use --force to rebuild")
        return 0

    import numpy as np
    import torch
    from transformers import AutoConfig, AutoModel, AutoTokenizer

    load_env_file()
    torch.set_grad_enabled(False)

    print(f"[bert-export] source model: {args.model_id}")
    print("[bert-export] loading PyTorch weights (first run downloads ~680 MB)...")
    started = time.time()
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    config = AutoConfig.from_pretrained(args.model_id)
    model = AutoModel.from_pretrained(args.model_id, dtype=torch.float32)
    model.eval()
    print(f"[bert-export] loaded {type(model).__name__} in {time.time() - started:.1f}s")

    hidden_size = int(getattr(config, "hidden_size", 0))
    vocab_size = int(getattr(config, "vocab_size", 0))
    if hidden_size != 768 or vocab_size != 119547:
        print(
            f"[bert-export] refusing unexpected architecture: hidden={hidden_size} vocab={vocab_size}",
            file=sys.stderr,
        )
        return 1

    class Encoder(torch.nn.Module):
        def __init__(self, inner):
            super().__init__()
            self.inner = inner

        def forward(self, input_ids, attention_mask, token_type_ids):
            # Only expose the contextual encoder output. The MLM head is not used
            # by SultiAI's embedding/similarity classifier.
            return self.inner(
                input_ids=input_ids,
                attention_mask=attention_mask,
                token_type_ids=token_type_ids,
                output_hidden_states=False,
                return_dict=True,
            ).last_hidden_state

    encoder = Encoder(model)
    encoder.eval()

    sample_texts = [
        "Maayong buntag! Kumusta ka?",
        "Tagpila ang isda karon, nang?",
    ]
    encoded = tokenizer(
        sample_texts,
        padding=True,
        truncation=True,
        max_length=32,
        return_tensors="pt",
    )

    output.mkdir(parents=True, exist_ok=True)
    onnx_dir.mkdir(parents=True, exist_ok=True)

    print("[bert-export] exporting base encoder to ONNX (opset 17)...")
    export_started = time.time()
    torch.onnx.export(
        encoder,
        (
            encoded["input_ids"],
            encoded["attention_mask"],
            encoded.get("token_type_ids", torch.zeros_like(encoded["input_ids"])),
        ),
        str(fp32_path),
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "token_type_ids": {0: "batch", 1: "sequence"},
            "last_hidden_state": {0: "batch", 1: "sequence"},
        },
        opset_version=17,
        do_constant_folding=True,
        dynamo=False,
    )
    print(f"[bert-export] exported in {time.time() - export_started:.1f}s: {fp32_path}")

    print("[bert-export] quantizing dynamically to int8...")
    from onnxruntime.quantization import QuantType, quantize_dynamic

    quantize_dynamic(
        model_input=str(fp32_path),
        model_output=str(quantized_path),
        weight_type=QuantType.QInt8,
    )
    print(f"[bert-export] quantized: {quantized_path} ({quantized_path.stat().st_size / 1e6:.1f} MB)")

    tokenizer.save_pretrained(output)
    config.architectures = ["BertModel"]
    config.save_pretrained(output)

    # Verify the exported graph against the PyTorch encoder on mean-pooled
    # contextual vectors. This catches a wrong output head or broken export.
    import onnxruntime as ort

    feeds = {
        "input_ids": encoded["input_ids"].numpy().astype(np.int64),
        "attention_mask": encoded["attention_mask"].numpy().astype(np.int64),
        "token_type_ids": encoded.get("token_type_ids", torch.zeros_like(encoded["input_ids"]))
        .numpy()
        .astype(np.int64),
    }
    with torch.no_grad():
        torch_hidden = encoder(
            encoded["input_ids"],
            encoded["attention_mask"],
            encoded.get("token_type_ids", torch.zeros_like(encoded["input_ids"])),
        ).numpy()

    torch_pooled = mean_pool(torch_hidden, feeds["attention_mask"])

    def verify(path: Path) -> list[float]:
        session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
        hidden = session.run(["last_hidden_state"], feeds)[0]
        pooled = mean_pool(hidden, feeds["attention_mask"])
        return [cosine(pooled[i], torch_pooled[i]) for i in range(len(sample_texts))]

    fp32_similarities = verify(fp32_path)
    quantized_similarities = verify(quantized_path)

    metadata = {
        "baseModelId": args.model_id,
        "baseModelSha": None,
        "exportedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "task": "feature-extraction",
        "outputName": "last_hidden_state",
        "quantization": "dynamic-int8 (optional; fp32 is the default runtime graph)",
        "hiddenSize": hidden_size,
        "vocabSize": vocab_size,
        "fp32Sha256": sha256_file(fp32_path),
        "quantizedSha256": sha256_file(quantized_path),
        # Backwards-compatible field used by older builds.
        "onnxSha256": sha256_file(quantized_path),
        "verification": {
            "samples": sample_texts,
            "fp32MeanPooledCosineVsPyTorch": [round(value, 6) for value in fp32_similarities],
            "quantizedMeanPooledCosineVsPyTorch": [round(value, 6) for value in quantized_similarities],
            "meanPooledCosineVsPyTorch": [round(value, 6) for value in quantized_similarities],
        },
    }

    try:
        from huggingface_hub import model_info

        metadata["baseModelSha"] = model_info(args.model_id).sha
    except Exception as exc:  # pragma: no cover - provenance is best-effort
        metadata["provenanceNote"] = f"could not fetch model SHA: {exc}"

    (output / "sulti-model.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("[bert-export] fp32 cosine vs PyTorch:", fp32_similarities)
    print("[bert-export] q8 cosine vs PyTorch:", quantized_similarities)
    if min(fp32_similarities) < 0.999:
        print("[bert-export] WARNING: fp32 graph diverges from PyTorch", file=sys.stderr)
    if min(quantized_similarities) < 0.90:
        print("[bert-export] WARNING: quantized graph diverges from PyTorch", file=sys.stderr)

    if args.drop_fp32:
        fp32_path.unlink(missing_ok=True)
        print("[bert-export] removed fp32 graph; runtime will use q8")

    print(f"[bert-export] ready: {output}")
    print(f"[bert-export] fp32 sha256: {metadata['fp32Sha256']}")
    print(f"[bert-export] q8 sha256: {metadata['quantizedSha256']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
