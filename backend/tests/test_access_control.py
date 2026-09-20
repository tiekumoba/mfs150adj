"""Access control: a valid Clerk login is not enough, the user needs an active app_users row
with the right role. Tests that take the `db` fixture need TEST_DATABASE_URL (see conftest)."""

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.helpers import Db

ADMIN_ONLY = "/api/v1/users"
ADJUDICATOR_ONLY = "/api/v1/me/assignments"
ANY_ACTIVE_USER = "/api/v1/me"
ALL_ROUTES = [ADMIN_ONLY, ADJUDICATOR_ONLY, ANY_ACTIVE_USER]

MakeToken = Callable[..., str]


def get(client: TestClient, path: str, token: str):
    return client.get(path, headers={"Authorization": f"Bearer {token}"})


# --- No database needed: authentication comes first ---------------------------------------


@pytest.mark.parametrize("path", ALL_ROUTES)
def test_no_token_is_401(client: TestClient, path: str) -> None:
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", ALL_ROUTES)
def test_invalid_token_is_401(client: TestClient, path: str) -> None:
    assert get(client, path, "not-a-jwt").status_code == 401


# --- A valid Clerk login without an active account ----------------------------------------


@pytest.mark.parametrize("path", ALL_ROUTES)
def test_login_without_app_user_is_403(
    client: TestClient, db: Db, make_token: MakeToken, path: str
) -> None:
    response = get(client, path, make_token(sub="user_stranger"))
    assert response.status_code == 403
    assert "not been invited" in response.json()["detail"]


@pytest.mark.parametrize("role", ["admin", "adjudicator"])
@pytest.mark.parametrize("path", ALL_ROUTES)
def test_deactivated_user_is_denied_everywhere(
    client: TestClient, db: Db, make_token: MakeToken, role: str, path: str
) -> None:
    db.add_user(role=role, status="deactivated", clerk_user_id="user_gone")
    response = get(client, path, make_token(sub="user_gone"))
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"]


def test_invited_user_that_is_not_activated_is_denied(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(status="invited", clerk_user_id="user_pending")
    response = get(client, ANY_ACTIVE_USER, make_token(sub="user_pending"))
    assert response.status_code == 403
    assert "not active" in response.json()["detail"]


def test_deactivating_a_user_takes_effect_immediately(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    user = db.add_user(clerk_user_id="user_a")
    token = make_token(sub="user_a")
    assert get(client, ANY_ACTIVE_USER, token).status_code == 200

    async def deactivate(session: AsyncSession) -> None:
        (await session.get_one(type(user), user.id)).status = "deactivated"

    db.run(deactivate)
    assert get(client, ANY_ACTIVE_USER, token).status_code == 403


# --- Active users and roles ---------------------------------------------------------------


@pytest.mark.parametrize("role", ["admin", "adjudicator"])
def test_active_user_can_read_their_own_account(
    client: TestClient, db: Db, make_token: MakeToken, role: str
) -> None:
    user = db.add_user(role=role, clerk_user_id="user_ok", email="ok@example.org")
    response = get(client, ANY_ACTIVE_USER, make_token(sub="user_ok"))
    assert response.status_code == 200
    assert response.json() == {
        "id": str(user.id),
        "clerk_user_id": "user_ok",
        "email": "ok@example.org",
        "display_name": user.display_name,
        "role": role,
        "status": "active",
    }


def test_token_from_an_allowed_origin_is_accepted(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(clerk_user_id="user_ok")
    token = make_token(sub="user_ok", azp="http://localhost:5173")
    assert get(client, ANY_ACTIVE_USER, token).status_code == 200


def test_admin_routes_admit_admins_only(client: TestClient, db: Db, make_token: MakeToken) -> None:
    db.add_user(role="admin", clerk_user_id="user_admin")
    db.add_user(role="adjudicator", clerk_user_id="user_adj")
    assert get(client, ADMIN_ONLY, make_token(sub="user_admin")).status_code == 200
    denied = get(client, ADMIN_ONLY, make_token(sub="user_adj"))
    assert denied.status_code == 403
    assert "permission" in denied.json()["detail"]


def test_adjudicator_routes_admit_adjudicators_only(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(role="admin", clerk_user_id="user_admin")
    db.add_user(role="adjudicator", clerk_user_id="user_adj")
    assert get(client, ADJUDICATOR_ONLY, make_token(sub="user_adj")).status_code == 200
    assert get(client, ADJUDICATOR_ONLY, make_token(sub="user_admin")).status_code == 403


# --- Linking an invited user on first sign-in ---------------------------------------------


def test_invited_user_is_linked_and_activated_by_email_on_first_sign_in(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    invited = db.add_user(status="invited", clerk_user_id=None, email="New.Person@Example.org")
    first = get(client, ANY_ACTIVE_USER, make_token(sub="user_new", email="new.person@example.org"))
    assert first.status_code == 200
    assert first.json()["status"] == "active"

    linked = db.get_user(invited.id)
    assert (linked.clerk_user_id, linked.status) == ("user_new", "active")
    # Later requests work from the Clerk ID alone.
    assert get(client, ANY_ACTIVE_USER, make_token(sub="user_new")).status_code == 200


def test_invited_user_cannot_sign_in_without_an_email_claim(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    invited = db.add_user(status="invited", clerk_user_id=None, email="new@example.org")
    assert get(client, ANY_ACTIVE_USER, make_token(sub="user_new")).status_code == 403
    assert db.get_user(invited.id).clerk_user_id is None


def test_email_that_matches_nobody_is_denied(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(status="invited", clerk_user_id=None, email="someone@example.org")
    token = make_token(sub="user_x", email="other@example.org")
    assert get(client, ANY_ACTIVE_USER, token).status_code == 403


@pytest.mark.parametrize(
    "fields",
    [
        {"status": "deactivated", "clerk_user_id": None},
        {"status": "active", "clerk_user_id": "user_someone_else"},
        {"status": "invited", "clerk_user_id": "user_someone_else"},
    ],
)
def test_only_unlinked_invited_users_can_be_claimed_by_email(
    client: TestClient, db: Db, make_token: MakeToken, fields: dict[str, str | None]
) -> None:
    row = db.add_user(email="taken@example.org", **fields)
    token = make_token(sub="user_intruder", email="taken@example.org")
    assert get(client, ANY_ACTIVE_USER, token).status_code == 403
    unchanged = db.get_user(row.id)
    assert (unchanged.status, unchanged.clerk_user_id) == (fields["status"], fields["clerk_user_id"])


# --- The routes behind the guards ---------------------------------------------------------


def test_users_lists_everyone_including_inactive_and_paginates(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(role="admin", clerk_user_id="user_admin", email="a@example.org")
    db.add_user(status="deactivated", email="b@example.org")
    db.add_user(status="invited", clerk_user_id=None, email="c@example.org")
    token = make_token(sub="user_admin")

    body = get(client, ADMIN_ONLY, token).json()
    assert body["total"] == 3
    assert [u["email"] for u in body["items"]] == ["a@example.org", "b@example.org", "c@example.org"]
    assert (body["limit"], body["offset"]) == (25, 0)

    page = get(client, f"{ADMIN_ONLY}?limit=1&offset=1", token).json()
    assert [u["email"] for u in page["items"]] == ["b@example.org"]
    assert page["total"] == 3


def test_limit_is_capped_and_bad_paging_is_rejected(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(role="admin", clerk_user_id="user_admin")
    token = make_token(sub="user_admin")
    assert get(client, f"{ADMIN_ONLY}?limit=100000", token).json()["limit"] == 100
    assert get(client, f"{ADMIN_ONLY}?limit=0", token).status_code == 422
    assert get(client, f"{ADMIN_ONLY}?offset=-1", token).status_code == 422


def test_assignments_show_only_my_active_categories(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    me = db.add_user(clerk_user_id="user_me")
    other = db.add_user(clerk_user_id="user_other")
    second = db.add_category("Second", sort_order=2)
    first = db.add_category("First", sort_order=1)
    revoked = db.add_category("Revoked", sort_order=3)
    someone_elses = db.add_category("Not mine", sort_order=4)
    db.assign(me, second)
    db.assign(me, first)
    db.assign(me, revoked, status="revoked")
    db.assign(other, someone_elses)

    body = get(client, ADJUDICATOR_ONLY, make_token(sub="user_me")).json()
    assert body["total"] == 2
    assert [a["category"]["name"] for a in body["items"]] == ["First", "Second"]


def test_adjudicator_with_no_assignments_gets_an_empty_list(
    client: TestClient, db: Db, make_token: MakeToken
) -> None:
    db.add_user(clerk_user_id="user_me")
    body = get(client, ADJUDICATOR_ONLY, make_token(sub="user_me")).json()
    assert body["items"] == [] and body["total"] == 0
