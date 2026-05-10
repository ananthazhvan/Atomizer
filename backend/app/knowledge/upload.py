import io
from fastapi import UploadFile
from PyPDF2 import PdfReader


async def process_document(file: UploadFile, project_id: str) -> list[str]:
    content = await file.read()
    filename = file.filename or "unknown"

    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )
    elif filename.endswith(".txt"):
        text = content.decode("utf-8")
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    return _chunk_text(text)


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(text), step):
        chunk = text[i:i + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks
