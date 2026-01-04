<script lang="ts">
  import { createForm } from "felte";
  import { validator } from "@felte/validator-yup";
  import * as yup from "yup";
  import QRCodeStyling from "qr-code-styling";
  import { onMount } from "svelte";

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
    qrCode = new QRCodeStyling({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      data: $data.url,
      margin: 0,
      type: "svg",
      dotsOptions: {
        color: $data.color,
        type: "square",
      },
      cornersSquareOptions: {
        color: $data.color,
        type: "square",
      },
      cornersDotOptions: {
        color: $data.color,
        type: "square",
      },
    });

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
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      document.body.appendChild(tempContainer);

      // Generate at a larger size for better quality, margin 0
      const generateSize = 300;
      const finalQRCode = new QRCodeStyling({
        width: generateSize,
        height: generateSize,
        data: $data.url,
        margin: 0,
        type: "svg",
        dotsOptions: {
          color: $data.color,
          type: "square",
        },
        cornersSquareOptions: {
          color: $data.color,
          type: "square",
        },
        cornersDotOptions: {
          color: $data.color,
          type: "square",
        },
        backgroundOptions: {
          color: "transparent",
        },
      });

      finalQRCode.append(tempContainer);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const svgElement = tempContainer.querySelector("svg");

      if (svgElement) {
        const dotClipPath = svgElement.querySelector(
          'clipPath[id*="dot-color"]'
        );
        const cornerSquarePaths = svgElement.querySelectorAll(
          'clipPath[id*="corners-square"]'
        );
        const cornerDotPaths = svgElement.querySelectorAll(
          'clipPath[id*="corners-dot"]'
        );

        // Measure actual QR pattern bounds
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        if (dotClipPath) {
          const allRects = dotClipPath.querySelectorAll("rect");
          allRects.forEach((rect) => {
            const x = parseFloat(rect.getAttribute("x") || "0");
            const y = parseFloat(rect.getAttribute("y") || "0");
            const w = parseFloat(rect.getAttribute("width") || "0");
            const h = parseFloat(rect.getAttribute("height") || "0");
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
          });
        }

        // Also check corner squares for bounds
        cornerSquarePaths.forEach((clipPath) => {
          const path = clipPath.querySelector("path");
          if (path) {
            const d = path.getAttribute("d") || "";
            const matches = d.matchAll(/M\s*([\d.]+)\s+([\d.]+)/g);
            for (const match of matches) {
              const x = parseFloat(match[1]);
              const y = parseFloat(match[2]);
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x + 28); // Corner squares are ~28px
              maxY = Math.max(maxY, y + 28);
            }
          }
        });

        const qrWidth = maxX - minX;
        const qrHeight = maxY - minY;

        // Calculate how to fit QR into target size with margin
        const targetSize = $data.size - $data.margin * 2;
        const scale = targetSize / Math.max(qrWidth, qrHeight);

        // Calculate offset to center and add margin
        const scaledWidth = qrWidth * scale;
        const scaledHeight = qrHeight * scale;
        const offsetX =
          $data.margin + (targetSize - scaledWidth) / 2 - minX * scale;
        const offsetY =
          $data.margin + (targetSize - scaledHeight) / 2 - minY * scale;

        const defs = svgElement.querySelector("defs");
        const clippedRects = svgElement.querySelectorAll("rect[clip-path]");
        clippedRects.forEach((rect) => rect.remove());
        if (defs) defs.remove();

        while (svgElement.firstChild) {
          svgElement.removeChild(svgElement.firstChild);
        }

        // Add dots with scale and offset
        if (dotClipPath) {
          const dotRects = dotClipPath.querySelectorAll("rect");
          dotRects.forEach((rect) => {
            const newRect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            const x =
              parseFloat(rect.getAttribute("x") || "0") * scale + offsetX;
            const y =
              parseFloat(rect.getAttribute("y") || "0") * scale + offsetY;
            const w = parseFloat(rect.getAttribute("width") || "0") * scale;
            const h = parseFloat(rect.getAttribute("height") || "0") * scale;

            newRect.setAttribute("x", x.toString());
            newRect.setAttribute("y", y.toString());
            newRect.setAttribute("width", w.toString());
            newRect.setAttribute("height", h.toString());
            newRect.setAttribute("fill", $data.color);
            svgElement.appendChild(newRect);
          });
        }

        // Add corner squares with transform
        cornerSquarePaths.forEach((clipPath) => {
          const path = clipPath.querySelector("path");
          if (path) {
            const newPath = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            newPath.setAttribute("d", path.getAttribute("d") || "");
            newPath.setAttribute("fill", $data.color);
            newPath.setAttribute("fill-rule", "evenodd");
            newPath.setAttribute(
              "transform",
              `translate(${offsetX},${offsetY}) scale(${scale})`
            );
            svgElement.appendChild(newPath);
          }
        });

        // Add corner dots with scale and offset
        cornerDotPaths.forEach((clipPath) => {
          const rect = clipPath.querySelector("rect");
          if (rect) {
            const newRect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            const x =
              parseFloat(rect.getAttribute("x") || "0") * scale + offsetX;
            const y =
              parseFloat(rect.getAttribute("y") || "0") * scale + offsetY;
            const w = parseFloat(rect.getAttribute("width") || "0") * scale;
            const h = parseFloat(rect.getAttribute("height") || "0") * scale;

            newRect.setAttribute("x", x.toString());
            newRect.setAttribute("y", y.toString());
            newRect.setAttribute("width", w.toString());
            newRect.setAttribute("height", h.toString());
            newRect.setAttribute("fill", $data.color);
            svgElement.appendChild(newRect);
          }
        });

        // Set final SVG size
        svgElement.setAttribute("width", $data.size.toString());
        svgElement.setAttribute("height", $data.size.toString());
        svgElement.setAttribute("viewBox", `0 0 ${$data.size} ${$data.size}`);

        let svgText = new XMLSerializer().serializeToString(svgElement);

        svgText = svgText
          .replace(/<\?xml[^?]*\?>\s*/g, "")
          .replace(/xmlns:xlink="[^"]*"/g, "")
          .replace(/xlink:/g, "");

        (window as any).postMessage(
          "insertQRCode",
          svgText,
          $data.size,
          $data.margin
        );
      }

      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error getting QR code:", error);
    }
  }
</script>

<section class="flex flex-col gap-6">
  <div class="flex flex-col items-center relative">
    <div
      bind:this={qrContainer}
      class="flex border border-border rounded-lg size-37.5 items-center justify-center overflow-hidden p-2"
    />

    {#if isGenerating}
      <div
        class="absolute inset-0 bg-white flex items-center justify-center rounded-lg"
      >
        <iconify-icon
          icon="lucide:loader-circle"
          class="text-2xl animate-spin text-gray-600"
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
          class="text-base text-muted"
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
            class="text-base text-muted"
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
            class="text-base text-muted"
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
            icon="material-symbols:resize-rounded"
            class="text-base text-muted"
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
        class="default">Update</button
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
