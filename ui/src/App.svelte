<script lang="ts">
  let count: number = 0;

  function increment() {
    count += 1;
  }
</script>

<div class="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
  <h1 class="text-4xl font-bold text-gray-800 mb-4">
    Hello Svelte + Tailwind!
  </h1>
  
  <p class="text-lg text-gray-600 mb-6">
    Count: <span class="font-semibold text-blue-600">{count}</span>
  </p>
  
  <button 
    on:click={increment}
    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
  >
    Click me
  </button>
</div>
