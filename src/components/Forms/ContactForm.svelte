<script>
  import { onMount } from 'svelte';
  import { showToast } from '../../lib/toast.js';
  import appConfig from '../../appConfig';
  
  const API_URL = appConfig.apiUrl;
  const BUSINESS_ID = appConfig.businessId;
  
  let collection = null;
  let form = {};
  let isLoading = true;
  let isSubmitting = false;
  
  onMount(async () => {
    await loadSchema();
  });
  
  async function loadSchema() {
    isLoading = true;
    try {
      const res = await fetch(
        `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/contact_form`
      );
      collection = await res.json();
      
      collection.blocks.forEach((f) => {
        form[f.key] = "";
      });
    } catch (error) {
      console.error("Failed to load form schema:", error);
    } finally {
      isLoading = false;
    }
  }
  
  async function submit() {
    isSubmitting = true;
    
    const payload = {
      collectionId: collection.id,
      blocks: collection.blocks.map((f) => ({
        ...f,
        value: [form[f.key]],
      })),
    };
    
    try {
      const r = await fetch(
        `${API_URL}/v1/businesses/${BUSINESS_ID}/collections/contact_form/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      
      if (!r.ok) throw new Error(await r.text());
      
      showToast("Thanks! Your message was submitted.", "success", 5000);
      
      collection.blocks.forEach((f) => {
        form[f.key] = "";
      });
    } catch (e) {
      console.error(e);
      showToast("Submission failed, please try again.", "error", 6000);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="contact-form-wrapper group max-w-xl relative h-full w-full">
  <div class="contact-form-glow"></div>

  <div class="relative z-10 p-1">
    <div class="bg-card rounded-xl px-4 py-10">
      <h1 class="h2">Contact Us</h1>
      <p class="description mt-6">Let us help you find the right plan for your business.</p>
      <p class="description mt-2 text-sm">
        Inputs marked with <span class="text-price">*</span> are required.
      </p>

      {#if isLoading}
        <div class="mt-8 text-center">
          <p class="text-primary">Loading form...</p>
        </div>
      {:else}
        <form
          id="contact-form"
          name="contact form"
          class="mt-8 flex flex-col gap-4 text-start"
          on:submit|preventDefault={submit}
        >
          <div class="xs:grid-cols-2 grid gap-4">
            <div>
              <label for="first_name" class="text-secondary text-sm">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                placeholder="Your first name"
                class="form__input mt-0.5"
                bind:value={form.first_name}
              />
            </div>

            <div>
              <label for="last_name" class="text-secondary text-sm">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                placeholder="Your last name"
                class="form__input mt-0.5"
                bind:value={form.last_name}
              />
            </div>
          </div>

          <div>
            <label for="company" class="text-secondary text-sm">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              placeholder="Your company or organization name"
              class="form__input mt-0.5"
              bind:value={form.company}
            />
          </div>

          <div>
            <label for="email" class="text-secondary text-sm">
              Email <span class="text-price">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Your preferred contact email"
              class="form__input mt-0.5"
              required
              bind:value={form.email}
            />
          </div>

          <div>
            <label for="message" class="text-secondary text-sm">
              Message <span class="text-price">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              placeholder="How can we help?"
              class="form__input mt-0.5"
              required
              bind:value={form.message}
            ></textarea>
          </div>

          <button 
            type="submit" 
            class="btn-primary mt-1 {isSubmitting ? 'opacity-70 cursor-wait' : ''}"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .contact-form-wrapper {
    border-radius: 1rem;
    background: var(--gradient-secondary);
  }

  .contact-form-wrapper::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: calc(1rem - 1px);
    background-color: var(--bg-card);
    opacity: 0.3;
  }

  .contact-form-glow {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
    margin: 0 auto;
    aspect-ratio: 1;
    width: 60%;
    filter: blur(3rem);
    background-color: var(--glow-brand);
  }
</style>
