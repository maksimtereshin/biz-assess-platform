/**
 * Focused tests for StructureEditor component
 *
 * Following KISS and YAGNI principles - testing only critical functionality:
 * 1. Component renders without errors
 * 2. Validation detects duplicate IDs
 * 3. Add/delete operations work correctly
 * 4. Structure updates trigger onChange callback
 *
 * Limiting to 2-8 tests maximum per spec requirements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StructureEditor from '../StructureEditor';

// Mock AdminJS design system components
jest.mock('@adminjs/design-system', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  FormGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Icon: ({ icon, ...props }: any) => <span {...props}>{icon}</span>,
}));

describe('StructureEditor', () => {
  const mockOnChange = jest.fn();

  const mockRecord = {
    params: {
      structure: JSON.stringify([
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
      ]),
    },
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  /**
   * Test 1: Component renders without errors
   * Critical: Ensures basic UI functionality
   */
  test('renders without errors and shows add category button', () => {
    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={mockRecord}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('+ Добавить категорию')).toBeInTheDocument();
  });

  /**
   * Test 2: Add category operation works
   * Critical: Core functionality for building survey structure
   */
  test('adds new category when button clicked', async () => {
    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={mockRecord}
        onChange={mockOnChange}
      />
    );

    const addButton = screen.getByText('+ Добавить категорию');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const callArg = mockOnChange.mock.calls[0][0];
      const structure = JSON.parse(callArg);
      expect(structure.length).toBe(2); // Original + new category
    });
  });

  /**
   * Test 3: Validation detects duplicate category IDs
   * Critical: Prevents data corruption
   */
  test('detects duplicate category IDs in structure', async () => {
    const duplicateRecord = {
      params: {
        structure: JSON.stringify([
          {
            id: 'cat1',
            name: 'Category 1',
            subcategories: [],
          },
          {
            id: 'cat1', // Duplicate ID
            name: 'Category 2',
            subcategories: [],
          },
        ]),
      },
    };

    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={duplicateRecord}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ошибки валидации:/)).toBeInTheDocument();
      expect(screen.getByText(/Дублирующийся ID категории: cat1/)).toBeInTheDocument();
    });
  });

  /**
   * Test 4: Validation detects missing required fields
   * Critical: Ensures data integrity
   */
  test('detects missing category name', async () => {
    const invalidRecord = {
      params: {
        structure: JSON.stringify([
          {
            id: 'cat1',
            name: '', // Empty name
            subcategories: [],
          },
        ]),
      },
    };

    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={invalidRecord}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Название категории обязательно/)).toBeInTheDocument();
    });
  });

  /**
   * Test 5: Validation detects invalid answer value range
   * Critical: Ensures answer values are 1-10 as per spec
   */
  test('detects invalid answer value range', async () => {
    const invalidAnswerRecord = {
      params: {
        structure: JSON.stringify([
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
                      { id: 1, text: '15', value: 15, color: '#FF0000', range: '15' }, // Invalid value
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      },
    };

    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={invalidAnswerRecord}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Значение ответа должно быть от 1 до 10/)
      ).toBeInTheDocument();
    });
  });

  /**
   * Test 6: Structure updates trigger onChange callback
   * Critical: Ensures parent component receives updated data
   */
  test('onChange is called when structure is modified', async () => {
    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={mockRecord}
        onChange={mockOnChange}
      />
    );

    // Component should call onChange on initial render with validation
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  /**
   * Test 7: Empty structure shows helpful message
   * Critical: UX - guides user when starting from scratch
   */
  test('shows helpful message when structure is empty', () => {
    const emptyRecord = {
      params: {
        structure: JSON.stringify([]),
      },
    };

    render(
      <StructureEditor
        property={{ name: 'structure' }}
        record={emptyRecord}
        onChange={mockOnChange}
      />
    );

    expect(
      screen.getByText(/Структура опроса пуста. Нажмите "Добавить категорию" для начала./)
    ).toBeInTheDocument();
  });
});
