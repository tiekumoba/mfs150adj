"""awards domain schema

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-19 18:46:58.850208
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('app_users',
    sa.Column('clerk_user_id', sa.Text(), nullable=True),
    sa.Column('email', sa.Text(), nullable=False),
    sa.Column('display_name', sa.Text(), nullable=False),
    sa.Column('role', sa.Text(), nullable=False),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('invited_by_clerk_user_id', sa.Text(), nullable=True),
    sa.Column('invited_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("role IN ('admin', 'adjudicator')", name=op.f('ck_app_users_role')),
    sa.CheckConstraint("status IN ('invited', 'active', 'deactivated')", name=op.f('ck_app_users_status')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_app_users')),
    sa.UniqueConstraint('clerk_user_id', name=op.f('uq_app_users_clerk_user_id')),
    sa.UniqueConstraint('email', name=op.f('uq_app_users_email'))
    )
    op.create_table('audit_events',
    sa.Column('occurred_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('actor_clerk_user_id', sa.Text(), nullable=False),
    sa.Column('action', sa.Text(), nullable=False),
    sa.Column('entity_type', sa.Text(), nullable=False),
    sa.Column('entity_id', sa.UUID(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.CheckConstraint("reason IS NOT NULL OR action NOT IN ('evaluation.reopened', 'conflict.cleared', 'result.superseded')", name=op.f('ck_audit_events_reason_required')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_events'))
    )
    op.create_table('awards',
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('reveal_nominator_details', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('created_by_clerk_user_id', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status IN ('draft', 'nominations', 'judging', 'finalized', 'archived')", name=op.f('ck_awards_status')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_awards'))
    )
    op.create_table('audit_event_changes',
    sa.Column('event_id', sa.UUID(), nullable=False),
    sa.Column('field_name', sa.Text(), nullable=False),
    sa.Column('old_value', sa.Text(), nullable=True),
    sa.Column('new_value', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.ForeignKeyConstraint(['event_id'], ['audit_events.id'], name=op.f('fk_audit_event_changes_event_id_audit_events'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_event_changes'))
    )
    op.create_table('categories',
    sa.Column('award_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('short_name', sa.Text(), nullable=False),
    sa.Column('group_name', sa.Text(), nullable=False),
    sa.Column('purpose', sa.Text(), nullable=True),
    sa.Column('nominator_guidance', sa.Text(), nullable=True),
    sa.Column('aggregation_method', sa.Text(), nullable=True),
    sa.Column('eligibility_rule', sa.Text(), nullable=True),
    sa.Column('minimum_evaluations', sa.Integer(), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('minimum_evaluations >= 1', name=op.f('ck_categories_minimum_evaluations_positive')),
    sa.ForeignKeyConstraint(['award_id'], ['awards.id'], name=op.f('fk_categories_award_id_awards'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_categories')),
    sa.UniqueConstraint('award_id', 'name', name=op.f('uq_categories_award_id_name'))
    )
    op.create_table('nominees',
    sa.Column('award_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['award_id'], ['awards.id'], name=op.f('fk_nominees_award_id_awards'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_nominees'))
    )
    op.create_index('ix_nominees_lower_name', 'nominees', [sa.literal_column('lower(name)')], unique=False)
    op.create_table('achievement_criteria',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('weight', sa.Numeric(precision=5, scale=4), nullable=False),
    sa.Column('weight_rationale', sa.Text(), nullable=True),
    sa.Column('max_score', sa.SmallInteger(), server_default=sa.text('5'), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('max_score > 0', name=op.f('ck_achievement_criteria_max_score_positive')),
    sa.CheckConstraint('weight > 0 AND weight <= 1', name=op.f('ck_achievement_criteria_weight_range')),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_achievement_criteria_category_id_categories'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_achievement_criteria')),
    sa.UniqueConstraint('category_id', 'sort_order', name=op.f('uq_achievement_criteria_category_id_sort_order'))
    )
    op.create_table('adjudicator_assignments',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('adjudicator_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('assigned_by_clerk_user_id', sa.Text(), nullable=True),
    sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status IN ('active', 'revoked')", name=op.f('ck_adjudicator_assignments_status')),
    sa.ForeignKeyConstraint(['adjudicator_id'], ['app_users.id'], name=op.f('fk_adjudicator_assignments_adjudicator_id_app_users'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_adjudicator_assignments_category_id_categories'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_adjudicator_assignments')),
    sa.UniqueConstraint('category_id', 'adjudicator_id', name=op.f('uq_adjudicator_assignments_category_id_adjudicator_id'))
    )
    op.create_table('candidacies',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('nominee_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('status_reason', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'withdrawn')", name=op.f('ck_candidacies_status')),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_candidacies_category_id_categories'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['nominee_id'], ['nominees.id'], name=op.f('fk_candidacies_nominee_id_nominees'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_candidacies')),
    sa.UniqueConstraint('category_id', 'nominee_id', name=op.f('uq_candidacies_category_id_nominee_id'))
    )
    op.create_table('category_results',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('aggregation_method', sa.Text(), nullable=False),
    sa.Column('eligibility_rule', sa.Text(), nullable=False),
    sa.Column('minimum_evaluations', sa.Integer(), nullable=False),
    sa.Column('finalized_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('finalized_by_clerk_user_id', sa.Text(), nullable=False),
    sa.Column('superseded_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('superseded_by_clerk_user_id', sa.Text(), nullable=True),
    sa.Column('supersede_reason', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('superseded_at IS NULL OR (supersede_reason IS NOT NULL AND superseded_by_clerk_user_id IS NOT NULL)', name=op.f('ck_category_results_superseded_has_details')),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_category_results_category_id_categories'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_category_results'))
    )
    op.create_index('uq_category_results_current', 'category_results', ['category_id'], unique=True, postgresql_where=sa.text('superseded_at IS NULL'))
    op.create_table('eligibility_criteria',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_eligibility_criteria_category_id_categories'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_eligibility_criteria')),
    sa.UniqueConstraint('category_id', 'sort_order', name=op.f('uq_eligibility_criteria_category_id_sort_order'))
    )
    op.create_table('adjudicator_conflicts',
    sa.Column('assignment_id', sa.UUID(), nullable=False),
    sa.Column('candidacy_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=False),
    sa.Column('declared_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('cleared_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('cleared_by_clerk_user_id', sa.Text(), nullable=True),
    sa.Column('clear_reason', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status <> 'cleared' OR (cleared_at IS NOT NULL AND cleared_by_clerk_user_id IS NOT NULL AND clear_reason IS NOT NULL)", name=op.f('ck_adjudicator_conflicts_cleared_has_details')),
    sa.CheckConstraint("status IN ('declared', 'cleared')", name=op.f('ck_adjudicator_conflicts_status')),
    sa.ForeignKeyConstraint(['assignment_id'], ['adjudicator_assignments.id'], name=op.f('fk_adjudicator_conflicts_assignment_id_adjudicator_assignments'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['candidacy_id'], ['candidacies.id'], name=op.f('fk_adjudicator_conflicts_candidacy_id_candidacies'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_adjudicator_conflicts')),
    sa.UniqueConstraint('assignment_id', 'candidacy_id', name=op.f('uq_adjudicator_conflicts_assignment_id_candidacy_id'))
    )
    op.create_table('category_result_entries',
    sa.Column('result_id', sa.UUID(), nullable=False),
    sa.Column('candidacy_id', sa.UUID(), nullable=False),
    sa.Column('outcome', sa.Text(), nullable=False),
    sa.Column('rank', sa.Integer(), nullable=True),
    sa.Column('total_score', sa.Numeric(precision=6, scale=3), nullable=True),
    sa.Column('evaluation_count', sa.Integer(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.CheckConstraint("(outcome = 'ranked') = (rank IS NOT NULL AND total_score IS NOT NULL)", name=op.f('ck_category_result_entries_ranked_has_rank_and_score')),
    sa.CheckConstraint("outcome IN ('ranked', 'ineligible', 'insufficient_evaluations')", name=op.f('ck_category_result_entries_outcome')),
    sa.ForeignKeyConstraint(['candidacy_id'], ['candidacies.id'], name=op.f('fk_category_result_entries_candidacy_id_candidacies'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['result_id'], ['category_results.id'], name=op.f('fk_category_result_entries_result_id_category_results'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_category_result_entries')),
    sa.UniqueConstraint('result_id', 'candidacy_id', name=op.f('uq_category_result_entries_result_id_candidacy_id'))
    )
    op.create_table('evaluations',
    sa.Column('assignment_id', sa.UUID(), nullable=False),
    sa.Column('candidacy_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.Text(), nullable=False),
    sa.Column('conclusion', sa.Text(), nullable=True),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status <> 'submitted' OR submitted_at IS NOT NULL", name=op.f('ck_evaluations_submitted_has_time')),
    sa.CheckConstraint("status IN ('draft', 'submitted', 'reopened')", name=op.f('ck_evaluations_status')),
    sa.ForeignKeyConstraint(['assignment_id'], ['adjudicator_assignments.id'], name=op.f('fk_evaluations_assignment_id_adjudicator_assignments'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['candidacy_id'], ['candidacies.id'], name=op.f('fk_evaluations_candidacy_id_candidacies'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_evaluations')),
    sa.UniqueConstraint('assignment_id', 'candidacy_id', name=op.f('uq_evaluations_assignment_id_candidacy_id'))
    )
    op.create_table('nominations',
    sa.Column('candidacy_id', sa.UUID(), nullable=False),
    sa.Column('nominator_name', sa.Text(), nullable=False),
    sa.Column('nominator_phone', sa.Text(), nullable=True),
    sa.Column('justification', sa.Text(), nullable=False),
    sa.Column('submission_status', sa.Text(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['candidacy_id'], ['candidacies.id'], name=op.f('fk_nominations_candidacy_id_candidacies'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_nominations'))
    )
    op.create_table('tie_break_rules',
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('rule_type', sa.Text(), nullable=False),
    sa.Column('criterion_id', sa.UUID(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name=op.f('fk_tie_break_rules_category_id_categories'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['criterion_id'], ['achievement_criteria.id'], name=op.f('fk_tie_break_rules_criterion_id_achievement_criteria'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_tie_break_rules')),
    sa.UniqueConstraint('category_id', 'sort_order', name=op.f('uq_tie_break_rules_category_id_sort_order'))
    )
    op.create_table('evaluation_eligibility_checks',
    sa.Column('evaluation_id', sa.UUID(), nullable=False),
    sa.Column('criterion_id', sa.UUID(), nullable=False),
    sa.Column('result', sa.Text(), nullable=True),
    sa.Column('evidence_reviewed', sa.Text(), nullable=True),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("result IN ('pass', 'fail')", name=op.f('ck_evaluation_eligibility_checks_result')),
    sa.ForeignKeyConstraint(['criterion_id'], ['eligibility_criteria.id'], name=op.f('fk_evaluation_eligibility_checks_criterion_id'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['evaluation_id'], ['evaluations.id'], name=op.f('fk_evaluation_eligibility_checks_evaluation_id_evaluations'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_evaluation_eligibility_checks')),
    sa.UniqueConstraint('evaluation_id', 'criterion_id', name=op.f('uq_evaluation_eligibility_checks_evaluation_id_criterion_id'))
    )
    op.create_table('evaluation_scores',
    sa.Column('evaluation_id', sa.UUID(), nullable=False),
    sa.Column('criterion_id', sa.UUID(), nullable=False),
    sa.Column('score', sa.SmallInteger(), nullable=True),
    sa.Column('basis', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('score >= 0', name=op.f('ck_evaluation_scores_score_non_negative')),
    sa.ForeignKeyConstraint(['criterion_id'], ['achievement_criteria.id'], name=op.f('fk_evaluation_scores_criterion_id_achievement_criteria'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['evaluation_id'], ['evaluations.id'], name=op.f('fk_evaluation_scores_evaluation_id_evaluations'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_evaluation_scores')),
    sa.UniqueConstraint('evaluation_id', 'criterion_id', name=op.f('uq_evaluation_scores_evaluation_id_criterion_id'))
    )
    op.create_table('nomination_evidence',
    sa.Column('nomination_id', sa.UUID(), nullable=False),
    sa.Column('kind', sa.Text(), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('filename', sa.Text(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("kind IN ('image', 'document')", name=op.f('ck_nomination_evidence_kind')),
    sa.ForeignKeyConstraint(['nomination_id'], ['nominations.id'], name=op.f('fk_nomination_evidence_nomination_id_nominations'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_nomination_evidence'))
    )


def downgrade() -> None:
    op.drop_table('nomination_evidence')
    op.drop_table('evaluation_scores')
    op.drop_table('evaluation_eligibility_checks')
    op.drop_table('tie_break_rules')
    op.drop_table('nominations')
    op.drop_table('evaluations')
    op.drop_table('category_result_entries')
    op.drop_table('adjudicator_conflicts')
    op.drop_table('eligibility_criteria')
    op.drop_index('uq_category_results_current', table_name='category_results', postgresql_where=sa.text('superseded_at IS NULL'))
    op.drop_table('category_results')
    op.drop_table('candidacies')
    op.drop_table('adjudicator_assignments')
    op.drop_table('achievement_criteria')
    op.drop_index('ix_nominees_lower_name', table_name='nominees')
    op.drop_table('nominees')
    op.drop_table('categories')
    op.drop_table('audit_event_changes')
    op.drop_table('awards')
    op.drop_table('audit_events')
    op.drop_table('app_users')
