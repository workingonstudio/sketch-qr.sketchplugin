<script lang="ts">
  import { onMount } from "svelte";
  import { createPreviewQR, generateQRForSketch } from "./lib/qrGenerator";
  import { createForm } from "felte";
  import { validator } from "@felte/validator-yup";
  import * as yup from "yup";
  import type QRCodeStyling from "qr-code-styling";

  let qrContainer: HTMLDivElement;
  let qrCode: QRCodeStyling | null = null;
  let isGenerating = false;
  let hasChangedSinceGenerate = false;

  const PREVIEW_SIZE = 150;

  const schema = yup.object({
    url: yup.string().url().required(),
    color: yup.string().required(),
    size: yup.number().required(),
    margin: yup.number().required(),
  });

  const { form, data, isValid } = createForm<yup.InferType<typeof schema>>({
    initialValues: {
      url: "https://wo.studio",
      color: "#000000",
      size: 150,
      margin: 0,
    },
    extend: validator({ schema }),
    onSubmit: async (values) => {
      isGenerating = true;
      await generateQRCode(values);
      isGenerating = false;
      hasChangedSinceGenerate = false;
    },
  });

  $: if ($data) {
    hasChangedSinceGenerate = true;
  }

  onMount(() => {
    qrCode = createPreviewQR($data.url, $data.color, PREVIEW_SIZE);
    qrCode.append(qrContainer);
  });

  async function generateQRCode(values: yup.InferType<typeof schema>) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (qrCode) {
      qrCode.update({
        data: values.url,
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        margin: 0,
        dotsOptions: {
          color: values.color,
          type: "square",
        },
        cornersSquareOptions: {
          color: values.color,
          type: "square",
        },
        cornersDotOptions: {
          color: values.color,
          type: "square",
        },
      });
    }
  }

  async function insertQRCode() {
    if (!qrCode) return;

    try {
      const svgText = await generateQRForSketch({
        url: $data.url,
        color: $data.color,
        size: $data.size,
        margin: $data.margin,
      });

      (window as any).postMessage(
        "insertQRCode",
        svgText,
        $data.size,
        $data.margin,
        $data.url
      );
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }
</script>

<section class="flex flex-col gap-6">
  <div class="flex flex-col items-center relative">
    <div
      bind:this={qrContainer}
      class="flex border border-border dark:bg-white dark:border-zinc-950 rounded-lg size-37.5 items-center justify-center overflow-hidden p-2"
    />

    {#if isGenerating}
      <div
        class="absolute inset-0 bg-white dark:bg-zinc-900 flex items-center justify-center rounded-lg"
      >
        <iconify-icon
          icon="lucide:loader-circle"
          class="text-2xl animate-spin text-gray-600 dark:text-zinc-100"
        />
      </div>
    {/if}
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
          class="text-base text-muted dark:text-zinc-300"
          title="URL"
        ></iconify-icon>
        <input
          id="url-input"
          type="text"
          class="w-full"
          name="url"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </label>
      <div class="flex flex-row gap-3">
        <label
          for="color-input"
          class="w-full"
        >
          <iconify-icon
            icon="material-symbols:format-color-fill-rounded"
            class="text-base text-muted dark:text-zinc-300"
            title="Color"
          ></iconify-icon>
          <input
            id="color-input"
            type="text"
            class="w-full"
            name="color"
            maxlength="7"
            placeholder="#1E2939"
          />
        </label>
        <label
          for="number-input"
          class="w-full"
        >
          <iconify-icon
            icon="material-symbols:open-in-full-rounded"
            class="text-base text-muted dark:text-zinc-300"
            title="Size"
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
            icon="material-symbols:fullscreen-rounded"
            class="text-base text-muted dark:text-zinc-300"
            title="Margin"
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
        disabled={!$isValid || isGenerating || !hasChangedSinceGenerate}
        class="default border-stone-200 bg-stone-100 inset-ring-stone-50 disabled:hover:bg-transparent dark:text-zinc-50 dark:bg-zinc-900 dark:border-zinc-950 dark:inset-ring-zinc-700 dark:hover:bg-zinc-950"
        >Update</button
      >
      <button
        type="button"
        class="primary"
        on:click={insertQRCode}
        disabled={!qrCode}
      >
        Insert QR code
      </button>
    </div>
  </form>
</section>

<style>
  @reference "./app.css";
  input {
    @apply font-bold outline-0 text-sm;
  }
  button {
    @apply rounded-xl px-3 py-2.5 font-bold text-sm cursor-pointer;
    &.default {
      @apply border inset-ring;
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
