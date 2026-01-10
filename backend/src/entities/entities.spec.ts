import { Admin } from "./admin.entity";
import { Survey } from "./survey.entity";
import { SurveyVersion, SurveyVersionStatus } from "./survey-version.entity";
import { SurveySession } from "./survey-session.entity";

/**
 * Focused entity tests for Admin Panel CMS feature
 * Tests critical behaviors: entity structure, validation, type safety
 * Scope: 6 tests maximum (as per spec requirements)
 * NOTE: These are structure tests. Integration tests will run after migrations.
 */
describe("Admin Panel CMS Entities - Structure Tests", () => {
  /**
   * Test 1: Admin entity structure
   * Critical: Verifies admin entity has correct fields and types
   */
  it("should create Admin entity with correct structure", () => {
    const admin = new Admin();
    admin.id = 1;
    admin.telegram_username = "test_admin";
    admin.created_at = new Date();
    admin.created_by_id = null;

    expect(admin.id).toBe(1);
    expect(admin.telegram_username).toBe("test_admin");
    expect(admin.created_at).toBeInstanceOf(Date);
    expect(admin.created_by_id).toBeNull();
  });

  /**
   * Test 2: Admin self-reference structure
   * Critical: Verifies self-reference FK structure
   */
  it("should support self-reference for admin creation tracking", () => {
    const firstAdmin = new Admin();
    firstAdmin.id = 1;
    firstAdmin.telegram_username = "owner";
    firstAdmin.created_by_id = null;

    const secondAdmin = new Admin();
    secondAdmin.id = 2;
    secondAdmin.telegram_username = "created_admin";
    secondAdmin.created_by_id = firstAdmin.id;
    secondAdmin.created_by = firstAdmin;

    expect(secondAdmin.created_by).toBe(firstAdmin);
    expect(secondAdmin.created_by_id).toBe(1);
  });

  /**
   * Test 3: SurveyVersion entity structure with status enum
   * Critical: Verifies versioning entity has correct status enum
   */
  it("should create SurveyVersion with correct status enum", () => {
    const version = new SurveyVersion();
    version.id = 1;
    version.survey_id = 1;
    version.version = 1;
    version.name = "Test Survey v1";
    version.type = "EXPRESS";
    version.structure = [];
    version.status = SurveyVersionStatus.DRAFT;
    version.created_by_id = 1;
    version.created_at = new Date();
    version.updated_at = new Date();

    expect(version.status).toBe(SurveyVersionStatus.DRAFT);
    expect(SurveyVersionStatus.DRAFT).toBe("DRAFT");
    expect(SurveyVersionStatus.PUBLISHED).toBe("PUBLISHED");
    expect(SurveyVersionStatus.ARCHIVED).toBe("ARCHIVED");
  });

  /**
   * Test 4: Survey entity with new versioning fields
   * Critical: Verifies survey has latest_published_version_id and soft delete
   */
  it("should have latest_published_version_id and deleted_at fields", () => {
    const survey = new Survey();
    survey.id = 1;
    survey.type = "FULL";
    survey.name = "Full Survey";
    survey.structure = [];
    survey.latest_published_version_id = 5;
    survey.deleted_at = new Date();

    expect(survey.latest_published_version_id).toBe(5);
    expect(survey.deleted_at).toBeInstanceOf(Date);
  });

  /**
   * Test 5: SurveySession with survey_version_id
   * Critical: Verifies session can track specific survey version
   */
  it("should have survey_version_id field for version tracking", () => {
    const session = new SurveySession();
    session.id = "test-uuid";
    session.user_telegram_id = 123456789;
    session.survey_id = 1;
    session.survey_version_id = 3;
    session.status = "IN_PROGRESS";
    session.requires_payment = false;

    expect(session.survey_version_id).toBe(3);
    expect(session.survey_id).toBe(1);
  });

  /**
   * Test 6: Entity relationships type safety
   * Critical: Verifies TypeScript types for entity relationships
   */
  it("should have correct TypeScript types for entity relationships", () => {
    const survey = new Survey();
    survey.versions = [];
    survey.latest_published_version = new SurveyVersion();

    const version = new SurveyVersion();
    version.survey = new Survey();
    version.created_by = new Admin();

    const session = new SurveySession();
    session.survey_version = new SurveyVersion();

    // Type checks - these will fail at compile time if types are wrong
    expect(Array.isArray(survey.versions)).toBe(true);
    expect(version.survey).toBeInstanceOf(Survey);
    expect(version.created_by).toBeInstanceOf(Admin);
    expect(session.survey_version).toBeInstanceOf(SurveyVersion);
  });
});
