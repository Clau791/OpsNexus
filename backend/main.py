from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
import io

# Support both local execution (`uvicorn main:app`) and package import on Vercel.
try:
    from .auth import authenticate_user, create_access_token, SINGLE_USER
    from .api_integrations import get_nagios_alerts, get_optimum_tickets, get_mock_reports
    from .export_service import aggregate_data, generate_excel_export
except ImportError:
    from auth import authenticate_user, create_access_token, SINGLE_USER
    from api_integrations import get_nagios_alerts, get_optimum_tickets, get_mock_reports
    from export_service import aggregate_data, generate_excel_export

app = FastAPI(title="OpsNexus API")
router = APIRouter()

# Setup CORS
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000",
    "*", # Allow Vercel deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user():
    # Auth bypass enabled: every request is treated as the same user.
    return SINGLE_USER

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/dashboard")
async def get_dashboard_data(
    start_date: str = "2023-01-01", 
    end_date: str = "2023-12-31", 
    current_user: dict = Depends(get_current_user)
):
    # Determine date range (mock logic, taking strings for simplicity)
    # In production, use proper datetime parsing
    s_date = datetime.now() # Mock, effectively ignoring input for random generation base
    e_date = datetime.now() 
    
    alerts = get_nagios_alerts(s_date, e_date, current_user["company_id"])
    tickets = get_optimum_tickets(s_date, e_date, current_user["company_id"])
    
    return {
        "company_id": current_user["company_id"],
        "alerts_count": len(alerts),
        "tickets_count": len(tickets),
        "alerts": alerts,
        "tickets": tickets
    }

@router.get("/export")
async def export_data(
    current_user: dict = Depends(get_current_user)
):
    # Generate mock data
    s_date = datetime.now()
    e_date = datetime.now()
    data = aggregate_data(s_date, e_date, current_user["company_id"])
    
    excel_content = generate_excel_export(data)
    
    # Return as download
    return StreamingResponse(
        io.BytesIO(excel_content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=OpsNexus_Report.xlsx"}
    )

@router.get("/reports")
async def get_reports(
    current_user: dict = Depends(get_current_user)
):
    reports = get_mock_reports(current_user["company_id"])
    return {
        "count": len(reports),
        "reports": reports,
    }

@router.get("/")
def read_root():
    return {"message": "Agent Backend is running"}

app.include_router(router, prefix="/api")
