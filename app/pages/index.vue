<script setup lang="ts">
const form = reactive({ to: "", subject: "", message: "" });

// `immediate: false` turns useFetch into a request you fire yourself, from the
// submit handler, rather than one that runs while the page renders. `watch:
// false` stops it re-firing every time a field changes.
const { data, error, status, execute } = useFetch("/api/send", {
  method: "POST",
  body: form,
  immediate: false,
  watch: false
});
</script>

<template>
  <main>
    <h1>Send an email with Mailtea</h1>

    <form @submit.prevent="execute()">
      <label>
        To
        <input v-model="form.to" type="email" required placeholder="reader@yourdomain.com" />
      </label>
      <label>
        Subject
        <input v-model="form.subject" required placeholder="Hello from Nuxt" />
      </label>
      <label>
        Message
        <textarea v-model="form.message" rows="5" required placeholder="Written in a Nuxt form, sent by Mailtea." />
      </label>
      <button type="submit" :disabled="status === 'pending'">
        {{ status === "pending" ? "Sending..." : "Send" }}
      </button>
    </form>

    <p v-if="status === 'success' && data" class="ok">
      Sent. Email id: <code>{{ data.id }}</code>
    </p>
    <p v-else-if="error" class="failed">
      {{ error.data?.message ?? error.message }}
    </p>
  </main>
</template>

<style>
main {
  max-width: 34rem;
  margin: 4rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
label {
  display: block;
  margin-bottom: 1rem;
}
input,
textarea {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem;
  font: inherit;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 0.5rem 1rem;
  font: inherit;
  cursor: pointer;
}
button[disabled] {
  cursor: progress;
}
.ok {
  color: #0a7d33;
}
.failed {
  color: #b3261e;
}
</style>
