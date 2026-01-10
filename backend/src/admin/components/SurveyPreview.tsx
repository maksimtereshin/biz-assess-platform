import React, { useState, useEffect } from "react";
import { Box, Button, Text, Icon, Badge } from "@adminjs/design-system";

/**
 * SurveyPreview - Read-only component for displaying survey structure
 *
 * Features:
 * - Display survey structure: Categories → Subcategories → Questions → Answers
 * - Validation error highlighting (red borders)
 * - Tooltip with error description on hover
 * - List of all validation errors at bottom
 * - Collapsible tree structure for better UX
 * - Russian language interface
 *
 * Validation rules:
 * - Unique IDs for categories, subcategories, questions
 * - Required fields: name, questions array
 * - Answer options: value must be 1-10
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
  type: "category" | "subcategory" | "question" | "answer";
  nodeId: string;
}

interface SurveyPreviewProps {
  property: any;
  record: any;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({ property, record }) => {
  const [structure, setStructure] = useState<SurveyCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Initialize structure from record
  useEffect(() => {
    if (record?.params?.structure) {
      try {
        const parsed =
          typeof record.params.structure === "string"
            ? JSON.parse(record.params.structure)
            : record.params.structure;
        setStructure(parsed || []);

        // Expand all by default for preview
        const allCategoryIds = new Set(
          (parsed || []).map((cat: SurveyCategory) => cat.id),
        );
        const allSubcategoryIds = new Set(
          (parsed || []).flatMap((cat: SurveyCategory) =>
            cat.subcategories.map(
              (sub: SurveySubcategory) => `${cat.id}-${sub.id}`,
            ),
          ),
        );
        setExpandedCategories(allCategoryIds);
        setExpandedSubcategories(allSubcategoryIds);
      } catch (error) {
        console.error("Failed to parse structure:", error);
        setStructure([]);
      }
    }
  }, [record]);

  // Validate structure
  useEffect(() => {
    const errors = validateStructure(structure);
    setValidationErrors(errors);
  }, [structure]);

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
          type: "category",
          nodeId: `cat-${category.id}`,
        });
      } else {
        categoryIds.add(category.id);
      }

      // Check category name
      if (!category.name || category.name.trim() === "") {
        errors.push({
          path: `categories[${catIndex}].name`,
          message: `Отсутствует название категории`,
          type: "category",
          nodeId: `cat-${category.id}`,
        });
      }

      // Check subcategories array
      if (!category.subcategories || category.subcategories.length === 0) {
        errors.push({
          path: `categories[${catIndex}].subcategories`,
          message: `Категория "${category.name}" не содержит подкатегорий`,
          type: "category",
          nodeId: `cat-${category.id}`,
        });
      }

      category.subcategories?.forEach((subcategory, subIndex) => {
        const subKey = `${category.id}-${subcategory.id}`;

        // Check subcategory ID uniqueness
        if (subcategoryIds.has(subcategory.id)) {
          errors.push({
            path: `categories[${catIndex}].subcategories[${subIndex}].id`,
            message: `Дублирующийся ID подкатегории: ${subcategory.id}`,
            type: "subcategory",
            nodeId: `sub-${subKey}`,
          });
        } else {
          subcategoryIds.add(subcategory.id);
        }

        // Check subcategory name
        if (!subcategory.name || subcategory.name.trim() === "") {
          errors.push({
            path: `categories[${catIndex}].subcategories[${subIndex}].name`,
            message: `Отсутствует название подкатегории`,
            type: "subcategory",
            nodeId: `sub-${subKey}`,
          });
        }

        // Check questions array
        if (!subcategory.questions || subcategory.questions.length === 0) {
          errors.push({
            path: `categories[${catIndex}].subcategories[${subIndex}].questions`,
            message: `Подкатегория "${subcategory.name}" не содержит вопросов`,
            type: "subcategory",
            nodeId: `sub-${subKey}`,
          });
        }

        subcategory.questions?.forEach((question, qIndex) => {
          // Check question ID uniqueness
          if (questionIds.has(question.id)) {
            errors.push({
              path: `categories[${catIndex}].subcategories[${subIndex}].questions[${qIndex}].id`,
              message: `Дублирующийся ID вопроса: ${question.id}`,
              type: "question",
              nodeId: `q-${question.id}`,
            });
          } else {
            questionIds.add(question.id);
          }

          // Check question text
          if (!question.text || question.text.trim() === "") {
            errors.push({
              path: `categories[${catIndex}].subcategories[${subIndex}].questions[${qIndex}].text`,
              message: `Отсутствует текст вопроса`,
              type: "question",
              nodeId: `q-${question.id}`,
            });
          }

          // Check answer options
          question.answers?.forEach((answer, aIndex) => {
            if (answer.value < 1 || answer.value > 10) {
              errors.push({
                path: `categories[${catIndex}].subcategories[${subIndex}].questions[${qIndex}].answers[${aIndex}].value`,
                message: `Недопустимое значение ответа: ${answer.value} (должно быть 1-10)`,
                type: "answer",
                nodeId: `a-${question.id}-${answer.id}`,
              });
            }

            if (!answer.text || answer.text.trim() === "") {
              errors.push({
                path: `categories[${catIndex}].subcategories[${subIndex}].questions[${qIndex}].answers[${aIndex}].text`,
                message: `Отсутствует текст варианта ответа`,
                type: "answer",
                nodeId: `a-${question.id}-${answer.id}`,
              });
            }
          });
        });
      });
    });

    return errors;
  };

  // Check if node has errors
  const getNodeErrors = (nodeId: string): ValidationError[] => {
    return validationErrors.filter((err) => err.nodeId === nodeId);
  };

  // Toggle category expand/collapse
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle subcategory expand/collapse
  const toggleSubcategory = (categoryId: string, subcategoryId: string) => {
    const key = `${categoryId}-${subcategoryId}`;
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Render category
  const renderCategory = (category: SurveyCategory, index: number) => {
    const isExpanded = expandedCategories.has(category.id);
    const nodeId = `cat-${category.id}`;
    const errors = getNodeErrors(nodeId);
    const hasErrors = errors.length > 0;

    return (
      <Box
        key={category.id}
        mb="lg"
        p="lg"
        border="default"
        borderColor={hasErrors ? "error" : "grey40"}
        borderWidth={hasErrors ? 2 : 1}
        borderRadius="md"
        style={{ position: "relative" }}
        onMouseEnter={() => setHoveredNode(nodeId)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Tooltip for errors */}
        {hasErrors && hoveredNode === nodeId && (
          <Box
            style={{
              position: "absolute",
              top: "-40px",
              left: "10px",
              backgroundColor: "#fff",
              border: "1px solid #e53e3e",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxWidth: "300px",
            }}
          >
            {errors.map((err, idx) => (
              <Text key={idx} fontSize="sm" color="error">
                {err.message}
              </Text>
            ))}
          </Box>
        )}

        <Box display="flex" alignItems="center" mb="default">
          <Button
            size="sm"
            variant="text"
            onClick={() => toggleCategory(category.id)}
            style={{ padding: "4px 8px" }}
          >
            <Icon icon={isExpanded ? "ChevronDown" : "ChevronRight"} />
          </Button>
          <Text fontWeight="bold" fontSize="lg" ml="sm">
            {index + 1}.{" "}
            {category.name || <em style={{ color: "#999" }}>(без названия)</em>}
          </Text>
          {hasErrors && (
            <Badge variant="danger" ml="sm">
              {errors.length} {errors.length === 1 ? "ошибка" : "ошибок"}
            </Badge>
          )}
        </Box>

        {isExpanded && (
          <Box ml="xl">
            {category.subcategories?.map((subcategory, subIndex) =>
              renderSubcategory(category.id, subcategory, subIndex),
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render subcategory
  const renderSubcategory = (
    categoryId: string,
    subcategory: SurveySubcategory,
    index: number,
  ) => {
    const isExpanded = expandedSubcategories.has(
      `${categoryId}-${subcategory.id}`,
    );
    const nodeId = `sub-${categoryId}-${subcategory.id}`;
    const errors = getNodeErrors(nodeId);
    const hasErrors = errors.length > 0;

    return (
      <Box
        key={subcategory.id}
        mb="default"
        p="default"
        border="default"
        borderColor={hasErrors ? "error" : "grey20"}
        borderWidth={hasErrors ? 2 : 1}
        borderRadius="sm"
        style={{ position: "relative" }}
        onMouseEnter={() => setHoveredNode(nodeId)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Tooltip for errors */}
        {hasErrors && hoveredNode === nodeId && (
          <Box
            style={{
              position: "absolute",
              top: "-40px",
              left: "10px",
              backgroundColor: "#fff",
              border: "1px solid #e53e3e",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxWidth: "300px",
            }}
          >
            {errors.map((err, idx) => (
              <Text key={idx} fontSize="sm" color="error">
                {err.message}
              </Text>
            ))}
          </Box>
        )}

        <Box display="flex" alignItems="center" mb="sm">
          <Button
            size="sm"
            variant="text"
            onClick={() => toggleSubcategory(categoryId, subcategory.id)}
            style={{ padding: "4px 8px" }}
          >
            <Icon icon={isExpanded ? "ChevronDown" : "ChevronRight"} />
          </Button>
          <Text fontWeight="bold" ml="sm">
            {index + 1}.{" "}
            {subcategory.name || (
              <em style={{ color: "#999" }}>(без названия)</em>
            )}
          </Text>
          {hasErrors && (
            <Badge variant="danger" ml="sm" size="sm">
              {errors.length}
            </Badge>
          )}
        </Box>

        {isExpanded && (
          <Box ml="lg">
            {subcategory.questions?.map((question, qIndex) =>
              renderQuestion(question, qIndex),
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render question
  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const nodeId = `q-${question.id}`;
    const errors = getNodeErrors(nodeId);
    const hasErrors = errors.length > 0;

    return (
      <Box
        key={question.id}
        mb="sm"
        p="sm"
        border="default"
        borderColor={hasErrors ? "error" : "grey10"}
        borderWidth={hasErrors ? 2 : 1}
        borderRadius="sm"
        style={{ position: "relative" }}
        onMouseEnter={() => setHoveredNode(nodeId)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Tooltip for errors */}
        {hasErrors && hoveredNode === nodeId && (
          <Box
            style={{
              position: "absolute",
              top: "-40px",
              left: "10px",
              backgroundColor: "#fff",
              border: "1px solid #e53e3e",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxWidth: "300px",
            }}
          >
            {errors.map((err, idx) => (
              <Text key={idx} fontSize="sm" color="error">
                {err.message}
              </Text>
            ))}
          </Box>
        )}

        <Box display="flex" alignItems="flex-start" mb="xs">
          <Text fontSize="sm" mr="sm" style={{ minWidth: "20px" }}>
            {index + 1}.
          </Text>
          <Text fontSize="sm" flex="1">
            {question.text || <em style={{ color: "#999" }}>(без текста)</em>}
          </Text>
          {hasErrors && (
            <Badge variant="danger" size="sm">
              {errors.length}
            </Badge>
          )}
        </Box>

        {question.answers && question.answers.length > 0 && (
          <Box ml="lg" mt="xs">
            <Text fontSize="xs" color="grey60" mb="xs">
              Варианты ответа:
            </Text>
            {question.answers.map((answer) =>
              renderAnswer(question.id, answer),
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render answer option
  const renderAnswer = (questionId: number, answer: AnswerOption) => {
    const nodeId = `a-${questionId}-${answer.id}`;
    const errors = getNodeErrors(nodeId);
    const hasErrors = errors.length > 0;

    return (
      <Box
        key={answer.id}
        display="flex"
        alignItems="center"
        mb="xs"
        p="xs"
        border="default"
        borderColor={hasErrors ? "error" : "transparent"}
        borderWidth={hasErrors ? 2 : 0}
        borderRadius="sm"
        style={{ position: "relative" }}
        onMouseEnter={() => setHoveredNode(nodeId)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Tooltip for errors */}
        {hasErrors && hoveredNode === nodeId && (
          <Box
            style={{
              position: "absolute",
              top: "-40px",
              left: "10px",
              backgroundColor: "#fff",
              border: "1px solid #e53e3e",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxWidth: "300px",
            }}
          >
            {errors.map((err, idx) => (
              <Text key={idx} fontSize="xs" color="error">
                {err.message}
              </Text>
            ))}
          </Box>
        )}

        <Box
          style={{
            width: "16px",
            height: "16px",
            backgroundColor: answer.color || "#ccc",
            borderRadius: "50%",
            marginRight: "8px",
          }}
        />
        <Text fontSize="xs" mr="sm" style={{ minWidth: "30px" }}>
          {answer.value}
        </Text>
        <Text fontSize="xs" flex="1">
          {answer.text || <em style={{ color: "#999" }}>(без текста)</em>}
        </Text>
        <Text fontSize="xs" color="grey60">
          {answer.range}
        </Text>
        {hasErrors && (
          <Badge variant="danger" size="sm" ml="sm">
            !
          </Badge>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box mb="lg">
        <Text fontSize="xl" fontWeight="bold" mb="sm">
          Предпросмотр структуры опроса
        </Text>
        <Text fontSize="sm" color="grey60">
          {structure.length === 0
            ? "Структура опроса пуста"
            : `Категорий: ${structure.length}`}
        </Text>
      </Box>

      {/* Validation summary */}
      {validationErrors.length > 0 && (
        <Box mb="lg" p="lg" bg="errorLight" border="error" borderRadius="md">
          <Text fontWeight="bold" color="error" mb="sm">
            Обнаружено ошибок валидации: {validationErrors.length}
          </Text>
          <Box as="ul" pl="lg">
            {validationErrors.map((error, index) => (
              <Box key={index} as="li" mb="xs">
                <Text fontSize="sm" color="error">
                  {error.message}{" "}
                  <em style={{ color: "#999" }}>({error.path})</em>
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Structure tree */}
      {structure.length > 0 ? (
        structure.map((category, index) => renderCategory(category, index))
      ) : (
        <Box p="xl" textAlign="center" bg="grey10" borderRadius="md">
          <Text color="grey60">Структура опроса пуста или не загружена</Text>
        </Box>
      )}
    </Box>
  );
};

export default SurveyPreview;
