import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeForm from "@/components/RecipeForm";

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/components/ImageUpload", () => ({
  default: () => <div data-testid="image-upload" />,
}));

vi.mock("@/app/actions/recipes", () => ({
  createRecipe: (...args: unknown[]) => mockCreate(...args),
  updateRecipe: (...args: unknown[]) => mockUpdate(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      titleLabel: "Title",
      titlePlaceholder: "e.g. Grandma's Apple Pie",
      descriptionLabel: "Description",
      descriptionPlaceholder: "A short description…",
      categoryLabel: "Category",
      categoryPlaceholder: "e.g. Dessert",
      servingsLabel: "Servings",
      prepLabel: "Prep (min)",
      cookLabel: "Cook (min)",
      ingredientsTitle: "Ingredients",
      amountPlaceholder: "Amount",
      unitPlaceholder: "Unit",
      namePlaceholder: "Ingredient name",
      addIngredient: "+ Add ingredient",
      stepsTitle: "Instructions",
      addStep: "+ Add step",
      saving: "Saving…",
      saveChanges: "Save changes",
      createRecipe: "Create recipe",
      required: "required",
      errorGeneric: "Something went wrong.",
    };
    if (key === "stepPlaceholder") return `Step ${params?.number}…`;
    return map[key] ?? key;
  },
}));

describe("RecipeForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all basic fields", () => {
    render(<RecipeForm mode="create" />);
    expect(screen.getByPlaceholderText("e.g. Grandma's Apple Pie")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("A short description…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Dessert")).toBeInTheDocument();
    expect(screen.getByText("Ingredients")).toBeInTheDocument();
    expect(screen.getByText("Instructions")).toBeInTheDocument();
  });

  it("shows Create recipe button in create mode", () => {
    render(<RecipeForm mode="create" />);
    expect(screen.getByRole("button", { name: "Create recipe" })).toBeInTheDocument();
  });

  it("shows Save changes button in edit mode", () => {
    render(<RecipeForm mode="edit" recipeId="abc" />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("adds a new ingredient row when clicking + Add ingredient", async () => {
    render(<RecipeForm mode="create" />);
    const before = screen.getAllByPlaceholderText("Ingredient name").length;
    await userEvent.click(screen.getByRole("button", { name: "+ Add ingredient" }));
    expect(screen.getAllByPlaceholderText("Ingredient name")).toHaveLength(before + 1);
  });

  it("removes an ingredient row when clicking ×", async () => {
    render(<RecipeForm mode="create" />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add ingredient" }));
    const before = screen.getAllByPlaceholderText("Ingredient name").length;
    const removeButtons = screen.getAllByRole("button", { name: "×" });
    await userEvent.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText("Ingredient name")).toHaveLength(before - 1);
  });

  it("does not remove the last ingredient row", async () => {
    render(<RecipeForm mode="create" />);
    expect(screen.getAllByPlaceholderText("Ingredient name")).toHaveLength(1);
    const ingredientSection = screen.getByText("Ingredients").closest("section")!;
    const removeButton = within(ingredientSection).getByRole("button", { name: "×" });
    expect(removeButton).toBeDisabled();
  });

  it("adds a new step row when clicking + Add step", async () => {
    render(<RecipeForm mode="create" />);
    const before = screen.getAllByPlaceholderText(/Step \d+…/).length;
    await userEvent.click(screen.getByRole("button", { name: "+ Add step" }));
    expect(screen.getAllByPlaceholderText(/Step \d+…/)).toHaveLength(before + 1);
  });

  it("pre-fills fields in edit mode", () => {
    render(
      <RecipeForm
        mode="edit"
        recipeId="abc"
        defaultValues={{
          title: "Appeltaart",
          description: "Lekker",
          category: "Nagerecht",
          servings: "8",
          prepTime: "20",
          cookTime: "45",
          ingredients: [{ name: "Appels", amount: "4", unit: "stuks" }],
          steps: [{ instruction: "Schil de appels" }],
        }}
      />
    );
    expect(screen.getByDisplayValue("Appeltaart")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lekker")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Appels")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Schil de appels")).toBeInTheDocument();
  });

  it("calls createRecipe with form data on submit", async () => {
    render(<RecipeForm mode="create" />);
    await userEvent.type(screen.getByPlaceholderText("e.g. Grandma's Apple Pie"), "Stamppot");
    await userEvent.click(screen.getByRole("button", { name: "Create recipe" }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Stamppot" })
    );
  });
});
