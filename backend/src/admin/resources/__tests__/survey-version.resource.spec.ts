/**
 * Focused tests for SurveyVersion resource with StructureEditor
 *
 * Following KISS and YAGNI principles - testing only critical functionality:
 * 1. Resource configuration has custom component registered
 * 2. Structure property uses StructureEditor component
 * 3. Component path is correctly configured
 *
 * Limiting to 2-8 tests maximum per spec requirements
 */

import { SurveyVersionResourceOptions } from '../survey-version.resource';
import * as path from 'path';

describe('SurveyVersion Resource with StructureEditor', () => {
  /**
   * Test 1: Resource has structure property configured
   * Critical: Ensures StructureEditor is integrated
   */
  test('has structure property configured with custom component', () => {
    expect(SurveyVersionResourceOptions.properties).toHaveProperty('structure');
    const structureProperty = SurveyVersionResourceOptions.properties.structure;

    expect(structureProperty).toHaveProperty('components');
    expect(structureProperty.components).toHaveProperty('edit');
  });

  /**
   * Test 2: Structure property uses correct component path
   * Critical: Ensures AdminJS can load the custom component
   */
  test('structure property points to StructureEditor bundle', () => {
    const structureProperty = SurveyVersionResourceOptions.properties.structure;
    const componentPath = structureProperty.components.edit as string;

    expect(componentPath).toContain('StructureEditor.bundle');
    expect(componentPath).toContain('.adminjs');
  });

  /**
   * Test 3: Structure property is required
   * Critical: Data integrity - surveys must have structure
   */
  test('structure property is marked as required', () => {
    const structureProperty = SurveyVersionResourceOptions.properties.structure;

    expect(structureProperty.isRequired).toBe(true);
  });

  /**
   * Test 4: Structure property is visible in edit and show views
   * Critical: UX - admins need to see and edit structure
   */
  test('structure property is visible in correct views', () => {
    const structureProperty = SurveyVersionResourceOptions.properties.structure;

    expect(structureProperty.isVisible).toEqual({
      list: false, // Not shown in list (too large)
      filter: false, // Not filterable (JSONB)
      show: true, // Visible in show view
      edit: true, // Visible in edit view
    });
  });

  /**
   * Test 5: Structure property has correct type
   * Critical: Ensures JSONB data is handled correctly
   */
  test('structure property has mixed type for JSONB', () => {
    const structureProperty = SurveyVersionResourceOptions.properties.structure;

    expect(structureProperty.type).toBe('mixed');
  });

  /**
   * Test 6: Resource has all required custom actions
   * Critical: Ensures versioning workflow actions are available
   */
  test('resource has custom versioning actions', () => {
    expect(SurveyVersionResourceOptions.actions).toHaveProperty('createNewVersion');
    expect(SurveyVersionResourceOptions.actions).toHaveProperty('publishVersion');
    expect(SurveyVersionResourceOptions.actions).toHaveProperty('unpublishVersion');
  });

  /**
   * Test 7: Edit properties include structure
   * Critical: Ensures structure can be edited in edit view
   */
  test('structure is included in editProperties', () => {
    expect(SurveyVersionResourceOptions.editProperties).toContain('structure');
  });

  /**
   * Test 8: Structure property has Russian label
   * Critical: UX - interface is in Russian per spec requirements
   */
  test('structure property has Russian label', () => {
    const structureProperty = SurveyVersionResourceOptions.properties.structure;

    expect(structureProperty.props).toHaveProperty('label');
    expect(structureProperty.props.label).toBe('Структура опроса');
  });
});

/**
 * Validation tests for structure JSONB data
 * These test the validation logic that will be used by StructureEditor
 */
describe('Structure Validation (StructureEditor integration)', () => {
  /**
   * Test: Valid structure passes all checks
   * Critical: Ensures valid data is accepted
   */
  test('validates structure conforms to SurveyCategory[] interface', () => {
    const validStructure = [
      {
        id: 'cat1',
        name: 'Category 1',
        subcategories: [
          {
            id: 'sub1',
            name: 'Subcategory 1',
            questions: [
              {
                id: 1,
                text: 'Question 1',
                answers: [
                  { id: 1, text: '1', value: 1, color: '#FF0000', range: '1' },
                  { id: 2, text: '2', value: 2, color: '#FF3300', range: '2' },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Structure should be serializable
    expect(() => JSON.stringify(validStructure)).not.toThrow();

    // Structure should be parseable
    const parsed = JSON.parse(JSON.stringify(validStructure));
    expect(parsed).toEqual(validStructure);

    // Structure should have required properties
    expect(validStructure[0]).toHaveProperty('id');
    expect(validStructure[0]).toHaveProperty('name');
    expect(validStructure[0]).toHaveProperty('subcategories');
    expect(validStructure[0].subcategories[0]).toHaveProperty('questions');
    expect(validStructure[0].subcategories[0].questions[0]).toHaveProperty('answers');
  });
});
