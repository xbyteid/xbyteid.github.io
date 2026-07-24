import { describe, expect, it, vi } from 'vitest';
import { flushPromises, loadPage } from './helpers/page.js';

async function submitForm(options = {}) {
  const context = await loadPage('index.html', options);
  const { document } = context;
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const button = document.getElementById('formBtn');

  const event = new context.window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  return { ...context, form, status, button, event };
}

describe('contact form', () => {
  it('posts the form data to the configured endpoint instead of navigating', async () => {
    const { form, fetchCalls, event } = await submitForm();

    expect(event.defaultPrevented).toBe(true);
    expect(fetchCalls).toHaveLength(1);
    const [url, init] = fetchCalls[0];
    expect(url).toBe(form.action);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Accept: 'application/json' });
  });

  it('shows a sending state while the request is in flight', async () => {
    let release;
    const pending = new Promise((resolve) => {
      release = () => resolve({ ok: true });
    });
    const { status, button } = await submitForm({ fetchImpl: () => pending });

    expect(button.disabled).toBe(true);
    expect(status.hidden).toBe(false);
    expect(status.textContent).toBe('sending...');
    expect(status.className).toBe('form-status');

    release();
    await flushPromises();
    expect(button.disabled).toBe(false);
  });

  it('reports success and resets the form', async () => {
    const { status, form } = await submitForm({ fetchImpl: () => Promise.resolve({ ok: true }) });
    form.querySelector('input[type="email"], input').value = 'someone@example.com';

    await flushPromises();

    expect(status.className).toBe('form-status success');
    expect(status.textContent).toContain('sent');
  });

  it('reports an error when the endpoint rejects the submission', async () => {
    const { status, button } = await submitForm({ fetchImpl: () => Promise.resolve({ ok: false, status: 500 }) });

    await flushPromises();

    expect(status.className).toBe('form-status error');
    expect(status.textContent).toContain('telegram');
    expect(button.disabled).toBe(false);
  });

  it('reports an error when the network request throws', async () => {
    const { status } = await submitForm({ fetchImpl: () => Promise.reject(new Error('offline')) });

    await flushPromises();

    expect(status.className).toBe('form-status error');
  });

  it('hides the status message again after six seconds', async () => {
    vi.useFakeTimers();
    try {
      const { status } = await submitForm({ fetchImpl: () => Promise.resolve({ ok: true }) });
      await vi.advanceTimersByTimeAsync(0);
      expect(status.hidden).toBe(false);

      await vi.advanceTimersByTimeAsync(6000);
      expect(status.hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
