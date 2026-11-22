from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Job = Literal["admin.", "blue-collar", "entrepreneur", "housemaid", "management", "retired",
              "self-employed", "services", "student", "technician", "unemployed", "unknown"]
Marital = Literal["divorced", "married", "single", "unknown"]
Education = Literal["basic.4y", "basic.6y", "basic.9y", "high.school", "illiterate",
                    "professional.course", "university.degree", "unknown"]
YesNo = Literal["no", "yes", "unknown"]
Contact = Literal["cellular", "telephone"]
Month = Literal["mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
Day = Literal["mon", "tue", "wed", "thu", "fri"]
Poutcome = Literal["failure", "nonexistent", "success"]


class Customer(BaseModel):
    """One customer, using the original dataset column names (dotted names via alias)."""
    model_config = ConfigDict(populate_by_name=True)

    age: int = Field(ge=16, le=110)
    job: Job
    marital: Marital
    education: Education
    default: YesNo
    housing: YesNo
    loan: YesNo
    contact: Contact
    month: Month
    day_of_week: Day
    campaign: int = Field(ge=1, le=100, description="Contacts made in this campaign")
    pdays: int = Field(ge=0, le=999, description="Days since last contact, 999 = never contacted")
    previous: int = Field(ge=0, le=50)
    poutcome: Poutcome
    emp_var_rate: float = Field(alias="emp.var.rate", ge=-5, le=5)
    cons_price_idx: float = Field(alias="cons.price.idx", ge=85, le=100)
    cons_conf_idx: float = Field(alias="cons.conf.idx", ge=-60, le=0)
    euribor3m: float = Field(ge=0, le=8)
    nr_employed: float = Field(alias="nr.employed", ge=4500, le=5500)

    def to_row(self) -> dict:
        return self.model_dump(by_alias=True)


class Factor(BaseModel):
    feature: str
    value: str
    effect: float = Field(description="Change in probability vs. the reference customer when only this feature is reset")


class PredictResponse(BaseModel):
    probability: float
    percentile: float = Field(description="Share (0-100) of historical customers with a lower score")
    top_percent: float = Field(description="Customer ranks within this top % of historical scores")
    predicted_yes: bool
    threshold: float
    model_version: str
    model_name: str
    factors: list[Factor]


class BatchRow(BaseModel):
    row: int
    probability: float
    percentile: float
    predicted_yes: bool


class BatchResponse(BaseModel):
    n_rows: int
    n_predicted_yes: int
    threshold: float
    rows: list[BatchRow]
    model_version: str
