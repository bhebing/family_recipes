"use client";

import { useState, useTransition, useRef } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { createRecipe, updateRecipe, type RecipeFormData } from "@/app/actions/recipes";
import ImageUpload from "./ImageUpload";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  instruction: string;
}

interface Props {
  mode: "create" | "edit";
  recipeId?: string;
  defaultValues?: Partial<RecipeFormData & { ingredients: Ingredient[]; steps: Step[]; imageUrl: string | null }>;
}

const emptyIngredient = (): Ingredient => ({ name: "", amount: "", unit: "" });
const emptyStep = (): Step => ({ instruction: "" });

const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors";

const labelClass = "block text-xs font-medium uppercase tracking-widest text-stone-400 mb-2";

export default function RecipeForm({ mode, recipeId, defaultValues }: Props) {
  const t = useTranslations("RecipeForm");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [servings, setServings] = useState(defaultValues?.servings ?? "");
  const [prepTime, setPrepTime] = useState(defaultValues?.prepTime ?? "");
  const [cookTime, setCookTime] = useState(defaultValues?.cookTime ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    defaultValues?.ingredients?.length ? defaultValues.ingredients : [emptyIngredient()]
  );
  const [steps, setSteps] = useState<Step[]>(
    defaultValues?.steps?.length ? defaultValues.steps : [emptyStep()]
  );
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValues?.imageUrl ?? null);

  const amountRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateIngredient(idx: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)));
  }

  function updateStep(idx: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { instruction: value } : s)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data: RecipeFormData = {
      title, description, category,
      servings: String(servings),
      prepTime: String(prepTime),
      cookTime: String(cookTime),
      imageUrl,
      ingredients,
      steps,
    };

    startTransition(async () => {
      try {
        if (mode === "edit" && recipeId) {
          await updateRecipe(recipeId, data);
        } else {
          await createRecipe(data);
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(t("errorGeneric"));
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Photo */}
      <section>
        <label className={labelClass}>Foto</label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </section>

      {/* Basic info */}
      <section className="space-y-5">
        <div>
          <label className={labelClass}>{t("titleLabel")}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder={t("titlePlaceholder")}
          />
        </div>

        <div>
          <label className={labelClass}>{t("descriptionLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        <div>
          <label className={labelClass}>{t("categoryLabel")}</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder={t("categoryPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t("servingsLabel")}</label>
            <input type="number" min={1} value={servings}
              onChange={(e) => setServings(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("prepLabel")}</label>
            <input type="number" min={0} value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("cookLabel")}</label>
            <input type="number" min={0} value={cookTime}
              onChange={(e) => setCookTime(e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section>
        <label className={labelClass}>{t("ingredientsTitle")}</label>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                ref={(el) => { amountRefs.current[idx] = el; }}
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                placeholder={t("amountPlaceholder")}
                className="w-24 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
              />
              <input
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                placeholder={t("unitPlaceholder")}
                className="w-20 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
              />
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey && idx === ingredients.length - 1) {
                    e.preventDefault();
                    flushSync(() => setIngredients((prev) => [...prev, emptyIngredient()]));
                    amountRefs.current[idx + 1]?.focus();
                  }
                }}
                placeholder={t("namePlaceholder")}
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                disabled={ingredients.length === 1}
                className="text-stone-300 hover:text-red-400 disabled:opacity-30 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          className="mt-3 text-xs font-medium uppercase tracking-widest text-amber-700 hover:text-amber-800 transition-colors">
          {t("addIngredient")}
        </button>
      </section>

      {/* Steps */}
      <section>
        <label className={labelClass}>{t("stepsTitle")}</label>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="shrink-0 text-xs font-semibold text-amber-700 w-5 pt-3">
                {idx + 1}
              </span>
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(idx, e.target.value)}
                rows={2}
                placeholder={t("stepPlaceholder", { number: idx + 1 })}
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                disabled={steps.length === 1}
                className="text-stone-300 hover:text-red-400 disabled:opacity-30 transition-colors text-lg leading-none mt-2.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setSteps((prev) => [...prev, emptyStep()])}
          className="mt-3 text-xs font-medium uppercase tracking-widest text-amber-700 hover:text-amber-800 transition-colors">
          {t("addStep")}
        </button>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-amber-700 px-6 py-3 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? t("saving") : mode === "edit" ? t("saveChanges") : t("createRecipe")}
      </button>
    </form>
  );
}
