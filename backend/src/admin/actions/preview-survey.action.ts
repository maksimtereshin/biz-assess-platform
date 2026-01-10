import { ActionRequest, ActionResponse, ActionContext } from "adminjs";

/**
 * Custom AdminJS action: "Предпросмотр"
 * Displays the SurveyPreview component showing survey structure with validation highlighting
 * Available on show/edit views for all SurveyVersions
 *
 * Features:
 * - Displays survey structure as users will see it
 * - Highlights validation errors with red borders
 * - Shows tooltips on hover with error descriptions
 * - Lists all validation errors at bottom
 */
export const previewSurveyAction = {
  actionType: "record" as const,
  icon: "Eye",
  label: "Предпросмотр",
  showInDrawer: false, // Render inline instead of in drawer
  component: "SurveyPreview", // Points to the custom React component

  /**
   * Show action on show/edit views for all SurveyVersions
   * Preview is useful for both draft and published versions
   */
  isVisible: (context: ActionContext) => {
    const { record } = context;
    // Show for all records that have a structure field
    return !!record && !!record.params.structure;
  },

  /**
   * Handler that renders the custom SurveyPreview component
   * Returns the record data for the component to display
   */
  handler: async (
    request: ActionRequest,
    response: ActionResponse,
    context: ActionContext,
  ) => {
    const { record, currentAdmin } = context;

    // Return record data for preview component to render
    return {
      record: record?.toJSON(currentAdmin),
    };
  },
};
