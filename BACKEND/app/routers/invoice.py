from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.sale import Sale

from reportlab.pdfgen import canvas

router = APIRouter()


@router.get("/invoice/{sale_id}")
def get_invoice(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = db.query(Sale).filter(
        Sale.id == sale_id
    ).first()

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    pdf_file = f"invoice_{sale.id}.pdf"

    c = canvas.Canvas(pdf_file)

    c.setFont("Helvetica-Bold", 18)
    c.drawString(220, 800, "ERP Invoice")

    c.setFont("Helvetica", 12)
    c.drawString(100, 740, f"Sale ID: {sale.id}")
    c.drawString(100, 710, f"Customer ID: {sale.customer_id}")
    c.drawString(100, 680, f"Total Amount: Rs {sale.total_amount}")

    c.save()

    return FileResponse(
        path=pdf_file,
        media_type="application/pdf",
        filename=pdf_file
    )