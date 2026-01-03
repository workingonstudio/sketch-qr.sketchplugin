<script lang="ts">
</script>

<section class="flex flex-col gap-6">
  <div class="flex flex-col items-center">
    <div class="flex border border-border rounded-lg size-37.5"></div>
  </div>
  <form
    action=""
    class="flex flex-col gap-6"
  >
    <div class="flex flex-col gap-3">
      <label
        for=""
        class=""
      >
        <iconify-icon
          icon="material-symbols:link-rounded"
          class="text-base text-muted"
        ></iconify-icon>
        <input
          type="text"
          class="w-full"
          value="https://"
        />
      </label>
      <div class="flex flex-row gap-3">
        <label for="">
          <iconify-icon
            icon="material-symbols:format-color-fill-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            type="text"
            class="w-full"
            value="#1E2939"
            maxlength="7"
          />
        </label>
        <label
          for=""
          class=""
        >
          <iconify-icon
            icon="material-symbols:open-in-full-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            type="text"
            class="w-full"
            value="150"
            maxlength="3"
          />
        </label>
        <label for="">
          <iconify-icon
            icon="material-symbols:resize-rounded"
            class="text-base text-muted"
          ></iconify-icon>
          <input
            type="text"
            class="w-full"
            value="4"
            maxlength="2"
          />
        </label>
      </div>
    </div>
    <div class="flex flex-row justify-between">
      <button
        type="submit"
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
  }
  input {
    @apply font-bold outline-0 text-sm;
  }
  button {
    @apply rounded-xl px-3 py-2.5 font-bold text-sm  cursor-pointer;
    &.default {
      @apply border border-stone-200 bg-stone-100 inset-ring inset-ring-stone-50;
    }
    &.primary {
      @apply border bg-emerald-600 border-emerald-700 inset-ring inset-ring-emerald-500 text-white text-shadow-2xs text-shadow-emerald-700;
    }
  }
</style>
