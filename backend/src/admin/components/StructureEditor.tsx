import React, { useState, useEffect } from 'react';
import { Box, Button, Text, Icon, Input, Label, FormGroup } from '@adminjs/design-system';

/**
 * Custom React component for editing JSONB survey structure
 *
 * Features:
 * - Tree-like editor: Categories → Subcategories → Questions → Answers
 * - Add/edit/delete operations at all levels
 * - Real-time validation with error highlighting
 * - Russian language interface
 * - Collapsible tree structure for better UX
 *
 * Validation rules:
 * - Unique IDs for categories, subcategories, questions
 * - Required fields: name, questions array
 * - Answer options: value must be 1-10
 * - Structure must conform to SurveyCategory[] interface
 */

interface AnswerOption {
  id: number;
  text: string;
  value: number;
  color: string;
  range: string;
}

interface SurveyQuestion {
  id: number;
  text: string;
  answers?: AnswerOption[];
}

interface SurveySubcategory {
  id: string;
  name: string;
  questions: SurveyQuestion[];
}

interface SurveyCategory {
  id: string;
  name: string;
  subcategories: SurveySubcategory[];
}

interface ValidationError {
  path: string;
  message: string;
}

interface StructureEditorProps {
  property: any;
  record: any;
  onChange: (value: any) => void;
}

const StructureEditor: React.FC<StructureEditorProps> = ({ property, record, onChange }) => {
  const [structure, setStructure] = useState<SurveyCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [editingNode, setEditingNode] = useState<{ type: string; path: string } | null>(null);

  // Initialize structure from record
  useEffect(() => {
    if (record?.params?.structure) {
      try {
        const parsed = typeof record.params.structure === 'string'
          ? JSON.parse(record.params.structure)
          : record.params.structure;
        setStructure(parsed || []);
      } catch (error) {
        console.error('Failed to parse structure:', error);
        setStructure([]);
      }
    }
  }, [record]);

  // Validate structure and update parent component
  useEffect(() => {
    const errors = validateStructure(structure);
    setValidationErrors(errors);
    onChange(JSON.stringify(structure, null, 2));
  }, [structure, onChange]);

  // Validation function
  const validateStructure = (struct: SurveyCategory[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const categoryIds = new Set<string>();
    const subcategoryIds = new Set<string>();
    const questionIds = new Set<number>();

    struct.forEach((category, catIndex) => {
      // Check category ID uniqueness
      if (categoryIds.has(category.id)) {
        errors.push({
          path: `categories[${catIndex}].id`,
          message: `Дублирующийся ID категории: ${category.id}`,
        });
      }
      categoryIds.add(category.id);

      // Check required fields
      if (!category.name || category.name.trim() === '') {
        errors.push({
          path: `categories[${catIndex}].name`,
          message: 'Название категории обязательно',
        });
      }

      if (!category.subcategories || category.subcategories.length === 0) {
        errors.push({
          path: `categories[${catIndex}].subcategories`,
          message: 'Категория должна содержать хотя бы одну подкатегорию',
        });
      }

      category.subcategories?.forEach((subcategory, subIndex) => {
        const subPath = `categories[${catIndex}].subcategories[${subIndex}]`;

        // Check subcategory ID uniqueness
        if (subcategoryIds.has(subcategory.id)) {
          errors.push({
            path: `${subPath}.id`,
            message: `Дублирующийся ID подкатегории: ${subcategory.id}`,
          });
        }
        subcategoryIds.add(subcategory.id);

        // Check required fields
        if (!subcategory.name || subcategory.name.trim() === '') {
          errors.push({
            path: `${subPath}.name`,
            message: 'Название подкатегории обязательно',
          });
        }

        if (!subcategory.questions || subcategory.questions.length === 0) {
          errors.push({
            path: `${subPath}.questions`,
            message: 'Подкатегория должна содержать хотя бы один вопрос',
          });
        }

        subcategory.questions?.forEach((question, qIndex) => {
          const qPath = `${subPath}.questions[${qIndex}]`;

          // Check question ID uniqueness
          if (questionIds.has(question.id)) {
            errors.push({
              path: `${qPath}.id`,
              message: `Дублирующийся ID вопроса: ${question.id}`,
            });
          }
          questionIds.add(question.id);

          // Check required fields
          if (!question.text || question.text.trim() === '') {
            errors.push({
              path: `${qPath}.text`,
              message: 'Текст вопроса обязателен',
            });
          }

          // Validate answer options
          question.answers?.forEach((answer, aIndex) => {
            if (answer.value < 1 || answer.value > 10) {
              errors.push({
                path: `${qPath}.answers[${aIndex}].value`,
                message: `Значение ответа должно быть от 1 до 10 (текущее: ${answer.value})`,
              });
            }
          });
        });
      });
    });

    return errors;
  };

  // Toggle expand/collapse for categories
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle expand/collapse for subcategories
  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Add new category
  const addCategory = () => {
    const newId = `category_${Date.now()}`;
    const newCategory: SurveyCategory = {
      id: newId,
      name: 'Новая категория',
      subcategories: [],
    };
    setStructure([...structure, newCategory]);
    setExpandedCategories(new Set([...expandedCategories, newId]));
  };

  // Add new subcategory to category
  const addSubcategory = (categoryId: string) => {
    const newStructure = structure.map(category => {
      if (category.id === categoryId) {
        const newId = `subcategory_${Date.now()}`;
        const newSubcategory: SurveySubcategory = {
          id: newId,
          name: 'Новая подкатегория',
          questions: [],
        };
        return {
          ...category,
          subcategories: [...category.subcategories, newSubcategory],
        };
      }
      return category;
    });
    setStructure(newStructure);
  };

  // Add new question to subcategory
  const addQuestion = (categoryId: string, subcategoryId: string) => {
    const newStructure = structure.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories.map(subcategory => {
            if (subcategory.id === subcategoryId) {
              const newId = Math.max(0, ...subcategory.questions.map(q => q.id)) + 1;
              const newQuestion: SurveyQuestion = {
                id: newId,
                text: 'Новый вопрос',
                answers: generateDefaultAnswers(),
              };
              return {
                ...subcategory,
                questions: [...subcategory.questions, newQuestion],
              };
            }
            return subcategory;
          }),
        };
      }
      return category;
    });
    setStructure(newStructure);
  };

  // Generate default answer options (1-10 scale)
  const generateDefaultAnswers = (): AnswerOption[] => {
    return [
      { id: 1, text: '1', value: 1, color: '#FF0000', range: '1' },
      { id: 2, text: '2', value: 2, color: '#FF3300', range: '2' },
      { id: 3, text: '3', value: 3, color: '#FF6600', range: '3' },
      { id: 4, text: '4', value: 4, color: '#FF9900', range: '4' },
      { id: 5, text: '5', value: 5, color: '#FFCC00', range: '5' },
      { id: 6, text: '6', value: 6, color: '#CCFF00', range: '6' },
      { id: 7, text: '7', value: 7, color: '#99FF00', range: '7' },
      { id: 8, text: '8', value: 8, color: '#66FF00', range: '8' },
      { id: 9, text: '9', value: 9, color: '#33FF00', range: '9' },
      { id: 10, text: '10', value: 10, color: '#00FF00', range: '10' },
    ];
  };

  // Delete category
  const deleteCategory = (categoryId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      setStructure(structure.filter(cat => cat.id !== categoryId));
    }
  };

  // Delete subcategory
  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту подкатегорию?')) {
      const newStructure = structure.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            subcategories: category.subcategories.filter(sub => sub.id !== subcategoryId),
          };
        }
        return category;
      });
      setStructure(newStructure);
    }
  };

  // Delete question
  const deleteQuestion = (categoryId: string, subcategoryId: string, questionId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      const newStructure = structure.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            subcategories: category.subcategories.map(subcategory => {
              if (subcategory.id === subcategoryId) {
                return {
                  ...subcategory,
                  questions: subcategory.questions.filter(q => q.id !== questionId),
                };
              }
              return subcategory;
            }),
          };
        }
        return category;
      });
      setStructure(newStructure);
    }
  };

  // Update category name
  const updateCategoryName = (categoryId: string, name: string) => {
    const newStructure = structure.map(category => {
      if (category.id === categoryId) {
        return { ...category, name };
      }
      return category;
    });
    setStructure(newStructure);
  };

  // Update subcategory name
  const updateSubcategoryName = (categoryId: string, subcategoryId: string, name: string) => {
    const newStructure = structure.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories.map(subcategory => {
            if (subcategory.id === subcategoryId) {
              return { ...subcategory, name };
            }
            return subcategory;
          }),
        };
      }
      return category;
    });
    setStructure(newStructure);
  };

  // Update question text
  const updateQuestionText = (categoryId: string, subcategoryId: string, questionId: number, text: string) => {
    const newStructure = structure.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories.map(subcategory => {
            if (subcategory.id === subcategoryId) {
              return {
                ...subcategory,
                questions: subcategory.questions.map(question => {
                  if (question.id === questionId) {
                    return { ...question, text };
                  }
                  return question;
                }),
              };
            }
            return subcategory;
          }),
        };
      }
      return category;
    });
    setStructure(newStructure);
  };

  return (
    <Box>
      <Box mb="lg">
        <Button onClick={addCategory} variant="primary">
          + Добавить категорию
        </Button>
      </Box>

      {validationErrors.length > 0 && (
        <Box mb="lg" p="default" bg="errorLight" borderRadius="default">
          <Text fontWeight="bold" color="error" mb="sm">
            Ошибки валидации:
          </Text>
          {validationErrors.map((error, index) => (
            <Text key={index} color="error" fontSize="sm">
              • {error.path}: {error.message}
            </Text>
          ))}
        </Box>
      )}

      <Box>
        {structure.map((category, catIndex) => (
          <Box
            key={category.id}
            mb="lg"
            p="default"
            border="default"
            borderRadius="default"
            bg="white"
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb="sm"
            >
              <Box display="flex" alignItems="center" flex="1">
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => toggleCategory(category.id)}
                  mr="sm"
                >
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </Button>
                <Input
                  value={category.name}
                  onChange={(e: any) => updateCategoryName(category.id, e.target.value)}
                  placeholder="Название категории"
                  style={{ flex: 1, marginRight: '8px' }}
                />
              </Box>
              <Box display="flex" gap="sm">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => addSubcategory(category.id)}
                >
                  + Подкатегория
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteCategory(category.id)}
                >
                  Удалить
                </Button>
              </Box>
            </Box>

            {expandedCategories.has(category.id) && (
              <Box ml="xl">
                {category.subcategories.map((subcategory, subIndex) => (
                  <Box
                    key={subcategory.id}
                    mb="default"
                    p="sm"
                    border="default"
                    borderRadius="default"
                    bg="bg"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb="sm"
                    >
                      <Box display="flex" alignItems="center" flex="1">
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => toggleSubcategory(subcategory.id)}
                          mr="sm"
                        >
                          {expandedSubcategories.has(subcategory.id) ? '▼' : '▶'}
                        </Button>
                        <Input
                          value={subcategory.name}
                          onChange={(e: any) =>
                            updateSubcategoryName(category.id, subcategory.id, e.target.value)
                          }
                          placeholder="Название подкатегории"
                          style={{ flex: 1, marginRight: '8px' }}
                        />
                      </Box>
                      <Box display="flex" gap="sm">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => addQuestion(category.id, subcategory.id)}
                        >
                          + Вопрос
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteSubcategory(category.id, subcategory.id)}
                        >
                          Удалить
                        </Button>
                      </Box>
                    </Box>

                    {expandedSubcategories.has(subcategory.id) && (
                      <Box ml="lg">
                        {subcategory.questions.map((question, qIndex) => (
                          <Box
                            key={question.id}
                            mb="sm"
                            p="xs"
                            border="default"
                            borderRadius="default"
                            bg="white"
                          >
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Text fontWeight="bold" mr="sm">
                                Q{question.id}:
                              </Text>
                              <Input
                                value={question.text}
                                onChange={(e: any) =>
                                  updateQuestionText(
                                    category.id,
                                    subcategory.id,
                                    question.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Текст вопроса"
                                style={{ flex: 1, marginRight: '8px' }}
                              />
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  deleteQuestion(category.id, subcategory.id, question.id)
                                }
                              >
                                Удалить
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {structure.length === 0 && (
        <Box p="xxl" textAlign="center" bg="bg" borderRadius="default">
          <Text color="grey60">
            Структура опроса пуста. Нажмите "Добавить категорию" для начала.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default StructureEditor;
