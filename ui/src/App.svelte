<script lang="ts">
  import { createForm } from "felte";
  import { validator } from "@felte/validator-yup";
  import * as yup from "yup";

  const schema = yup.object({
    url: yup.string().url().required(),
    color: yup.string().length(7).required(),
    size: yup.number().required(),
    margin: yup.number().required(),
  });

  const { form, data, isValid } = createForm<yup.InferType<typeof schema>>({
    initialValues: {
      url: "https://workingon.studio",
      color: "#1E2939",
      size: 150,
      margin: 4,
    },
    extend: validator({ schema }),
    onSubmit: (values) => {
      console.log("Form submitted:", values);
    },
  });
</script>

<section class="flex flex-col gap-6">
  <div class="flex flex-col items-center">
    <div class="flex border border-border rounded-lg size-37.5"></div>
  </div>
  <form
    use:form
    class="flex flex-col gap-6"
  >
    <div class="flex flex-col gap-3">
      <label
        for="url-input"
        class=""
      >
        <iconify-icon
          icon="material-symbols:link-rounded"
          class="text-base text-muted"
        ></iconify-icon>
        <input
          id="url-input"
          type="text"
          class="w-full"
          name="url"
        />
      </label>
      <div class="flex flex-row gap-3">
        <label
          for="color-input"
          class="w-full"
        >
          <iconify-icon
            icon="material-symbols:format-color-fill-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            id="color-input"
            type="text"
            class="w-full"
            name="color"
            maxlength="7"
          />
        </label>
        <label
          for="number-input"
          class="w-fit"
        >
          <iconify-icon
            icon="material-symbols:open-in-full-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            id="number-input"
            type="number"
            class="w-full"
            name="size"
            maxlength="3"
          />
        </label>
        <label
          for="margin-input"
          class="w-fit"
        >
          <iconify-icon
            icon="material-symbols:resize-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            id="margin-input"
            type="number"
            class="w-full"
            name="margin"
            maxlength="2"
          />
        </label>
      </div>
    </div>
    <div class="flex flex-row justify-between">
      <button
        type="submit"
        disabled={!$isValid}
        class="default">Generate</button
      >
      <button
        type="button"
        class="primary">Insert QR code</button
      >
    </div>
  </form>
</section>

<style>
  @reference "./app.css";
  label {
    @apply flex flex-row items-center gap-2 border border-border p-3 rounded-lg inset-shadow-sm;
    &:focus-within {
      @apply ring ring-blue-500;
    }
  }
  input {
    @apply font-bold outline-0 text-sm;
  }
  button {
    @apply rounded-xl px-3 py-2.5 font-bold text-sm  cursor-pointer;
    &.default {
      @apply border border-stone-200 bg-stone-100 inset-ring inset-ring-stone-50;
      &:hover:not(:disabled) {
        @apply bg-stone-200/50;
      }
    }
    &.primary {
      @apply border bg-emerald-600 border-emerald-700 inset-ring inset-ring-emerald-500 text-white text-shadow-2xs text-shadow-emerald-700;
      &:hover:not(:disabled) {
      }
    }
    &:disabled {
      @apply opacity-30 cursor-default;
    }
  }
</style>
