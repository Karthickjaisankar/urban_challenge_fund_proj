"""Department / scheme / KPI dictionary for the ICCC dashboard.

Source: project spec doc (Let's pick 3 major schemes for the 6 departments...docx).
v0 implements Health only; the rest are declared so the frontend can render
the navigation skeleton and the mock engine can pre-allocate slots.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


SchemeTier = Literal["central", "state"]


@dataclass(frozen=True)
class Scheme:
    code: str
    name: str
    tier: SchemeTier
    state_scope: str | None = None  # None for central; "Tamil Nadu" / "Gujarat" for state
    metric_label: str = "Beneficiaries"  # default counter label


@dataclass(frozen=True)
class KPI:
    code: str
    name: str
    unit: str
    direction: Literal["lower_is_better", "higher_is_better"]


@dataclass(frozen=True)
class Department:
    code: str
    name: str
    accent: str  # tailwind-friendly hex for theming
    kpis: tuple[KPI, ...]
    central_schemes: tuple[Scheme, ...]
    tn_schemes: tuple[Scheme, ...]
    gj_schemes: tuple[Scheme, ...]


HEALTH = Department(
    code="health",
    name="Health",
    accent="#34d399",
    kpis=(
        KPI("imr", "Infant Mortality Rate", "per 1k", "lower_is_better"),
        KPI("mmr", "Maternal Mortality Ratio", "per 100k", "lower_is_better"),
        KPI("oope", "Out-of-Pocket Expenditure", "% of THE", "lower_is_better"),
    ),
    central_schemes=(
        Scheme("pmjay", "Ayushman Bharat (PM-JAY)", "central", metric_label="Hospital admissions"),
        Scheme("nhm", "National Health Mission", "central", metric_label="PHC funding utilised (₹ Cr)"),
        Scheme("pmsma", "PM Surakshit Matritva Abhiyan", "central", metric_label="ANC checkups"),
    ),
    tn_schemes=(
        Scheme("mtm", "Makkalai Thedi Maruthuvam", "state", "Tamil Nadu", "NCD screenings"),
        Scheme("ik48", "Innuyir Kappom (48)", "state", "Tamil Nadu", "Trauma claims"),
        Scheme("dmrm", "Dr Muthulakshmi Reddy Maternity", "state", "Tamil Nadu", "DBT disbursed"),
    ),
    gj_schemes=(
        Scheme("ma", "Mukhyamantri Amrutam (MA)", "state", "Gujarat", "BPL coverage"),
        Scheme("chiranjeevi", "Chiranjeevi Yojana", "state", "Gujarat", "Institutional deliveries"),
        Scheme("khilkhilat", "Khilkhilat Ambulance", "state", "Gujarat", "Drop-back rides"),
    ),
)

EDUCATION = Department(
    code="education", name="Education", accent="#60a5fa",
    kpis=(
        KPI("ger", "Gross Enrolment Ratio", "%", "higher_is_better"),
        KPI("ptr", "Pupil-Teacher Ratio", ":1", "lower_is_better"),
        KPI("dropout", "Dropout Rate", "%", "lower_is_better"),
    ),
    central_schemes=(
        Scheme("samagra", "Samagra Shiksha", "central", metric_label="Schools covered"),
        Scheme("pmshri", "PM SHRI Schools", "central", metric_label="Upgraded schools"),
        Scheme("poshan", "PM-POSHAN", "central", metric_label="Meals served"),
    ),
    tn_schemes=(
        Scheme("breakfast", "CM Breakfast Scheme", "state", "Tamil Nadu", "Meals delivered"),
        Scheme("itk", "Illam Thedi Kalvi", "state", "Tamil Nadu", "Children covered"),
        Scheme("naan", "Naan Mudhalvan", "state", "Tamil Nadu", "Students enrolled"),
    ),
    gj_schemes=(
        Scheme("praveshotsav", "Shala Praveshotsav", "state", "Gujarat", "Enrolments"),
        Scheme("accred", "School Accreditation", "state", "Gujarat", "Schools graded"),
        Scheme("vidyanjali", "Vidyanjali Yojana", "state", "Gujarat", "Volunteer hours"),
    ),
)

WCD = Department(
    code="wcd", name="Women & Child Development", accent="#f472b6",
    kpis=(
        KPI("csr", "Child Sex Ratio (0-6)", "f/1k m", "higher_is_better"),
        KPI("sam", "Severe Acute Malnutrition", "%", "lower_is_better"),
        KPI("flfpr", "Female LFPR", "%", "higher_is_better"),
    ),
    central_schemes=(
        Scheme("poshanab", "Poshan Abhiyaan", "central", metric_label="Children screened"),
        Scheme("bbbp", "Beti Bachao Beti Padhao", "central", metric_label="Districts covered"),
        Scheme("pmmvy", "PMMVY", "central", metric_label="DBT installments"),
    ),
    tn_schemes=(
        Scheme("pudhumai", "Pudhumai Penn", "state", "Tamil Nadu", "₹1k DBT to girls"),
        Scheme("cradle", "Cradle Baby Scheme", "state", "Tamil Nadu", "Cradles received"),
        Scheme("icds", "ICDS State Augment", "state", "Tamil Nadu", "Anganwadis active"),
    ),
    gj_schemes=(
        Scheme("vhali", "Vhali Dikri", "state", "Gujarat", "Beneficiaries"),
        Scheme("ganga", "Ganga Swaroopa Pension", "state", "Gujarat", "Widows enrolled"),
        Scheme("dudh", "Dudh Sanjeevani", "state", "Gujarat", "Litres distributed"),
    ),
)

REVENUE = Department(
    code="revenue", name="Revenue Administration", accent="#fbbf24",
    kpis=(
        KPI("tat", "e-Service TAT", "days", "lower_is_better"),
        KPI("grm", "Grievance Redressal Rate", "%", "higher_is_better"),
        KPI("ldr", "Land Digitization", "%", "higher_is_better"),
    ),
    central_schemes=(
        Scheme("svamitva", "SVAMITVA", "central", metric_label="Property cards issued"),
        Scheme("dilrmp", "DILRMP", "central", metric_label="Records digitized"),
        Scheme("pmkisan", "PM-KISAN", "central", metric_label="Farmer DBT"),
    ),
    tn_schemes=(
        Scheme("tnilam", "Tamil Nilam (Patta-Chitta)", "state", "Tamil Nadu", "Mutations"),
        Scheme("star2", "STAR 2.0", "state", "Tamil Nadu", "Registrations"),
        Scheme("makkaludan", "Makkaludan Mudhalvan", "state", "Tamil Nadu", "Petitions"),
    ),
    gj_schemes=(
        Scheme("anyror", "AnyRoR", "state", "Gujarat", "Record lookups"),
        Scheme("iora", "iORA", "state", "Gujarat", "NA applications"),
        Scheme("garib", "Garib Kalyan Mela", "state", "Gujarat", "Beneficiaries"),
    ),
)

DISASTER = Department(
    code="disaster", name="Disaster Management", accent="#f87171",
    kpis=(
        KPI("art", "Avg Response Time", "min", "lower_is_better"),
        KPI("ewc", "Early Warning Coverage", "%", "higher_is_better"),
        KPI("rds", "Relief Disbursement Speed", "days", "lower_is_better"),
    ),
    central_schemes=(
        Scheme("ncrmp", "NCRMP", "central", metric_label="Shelters built"),
        Scheme("aapda", "Aapda Mitra", "central", metric_label="Volunteers trained"),
        Scheme("sdrf", "SDRF Allocations", "central", metric_label="Funds utilised (₹ Cr)"),
    ),
    tn_schemes=(
        Scheme("tnsmart", "TN-SMART", "state", "Tamil Nadu", "Alerts issued"),
        Scheme("coastal", "Coastal DRR", "state", "Tamil Nadu", "Routes ready"),
        Scheme("seoc", "SEOC Upgradation", "state", "Tamil Nadu", "Comms uptime %"),
    ),
    gj_schemes=(
        Scheme("schoolsafe", "GSDMA School Safety", "state", "Gujarat", "Drills conducted"),
        Scheme("smriti", "Earthquake Resilience", "state", "Gujarat", "Buildings retrofitted"),
        Scheme("ewbs", "Early Warning Broadcast", "state", "Gujarat", "Sirens online"),
    ),
)

TOURISM = Department(
    code="tourism", name="Tourism", accent="#a78bfa",
    kpis=(
        KPI("dtv", "Domestic Tourist Footfall", "lakh/mo", "higher_is_better"),
        KPI("fta", "Foreign Tourist Arrivals", "thousand/mo", "higher_is_better"),
        KPI("occ", "Accommodation Occupancy", "%", "higher_is_better"),
    ),
    central_schemes=(
        Scheme("swadesh", "Swadesh Darshan", "central", metric_label="Projects complete"),
        Scheme("prashad", "PRASHAD", "central", metric_label="Sites upgraded"),
        Scheme("dekho", "Dekho Apna Desh", "central", metric_label="Campaign reach"),
    ),
    tn_schemes=(
        Scheme("hrce", "HR&CE Temple Renovation", "state", "Tamil Nadu", "Temples restored"),
        Scheme("destdev", "TN Destination Dev", "state", "Tamil Nadu", "Sites upgraded"),
        Scheme("ecotour", "Eco-Tourism Dev", "state", "Tamil Nadu", "Footfall (k)"),
    ),
    gj_schemes=(
        Scheme("rann", "Rann Utsav", "state", "Gujarat", "Tent occupancy %"),
        Scheme("heritage", "Heritage Tourism Policy", "state", "Gujarat", "Sites covered"),
        Scheme("statue", "Statue of Unity", "state", "Gujarat", "Daily ticket revenue"),
    ),
)


DEPARTMENTS: tuple[Department, ...] = (HEALTH, EDUCATION, WCD, REVENUE, DISASTER, TOURISM)


def department(code: str) -> Department:
    for d in DEPARTMENTS:
        if d.code == code:
            return d
    raise KeyError(code)
