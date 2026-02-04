from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
import io

from auth import authenticate_user, create_access_token, ALGORITHM, SECRET_KEY, FAKE_USERS_DB
from api_integrations import get_nagios_alerts, get_optimum_tickets
from export_service import aggregate_data, generate_excel_export
import jwt

app = FastAPI(title="OpsNexus API")

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = FAKE_USERS_DB.get(username)
    if user is None:
        raise credentials_exception
    return user

@app.post("/token")
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

@app.get("/dashboard")
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

@app.get("/export")
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

@app.get("/")
def read_root():
    return {"message": "Agent Backend is running"}
