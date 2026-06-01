'use client';

import { useState } from 'react';
import { createRestaurant } from '@/app/admin/actions';

export function RestaurantForm({
  certOptions
}: {
  certOptions: { id: string; label: string }[];
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
    <form action={createRestaurant} className="space-y-5">
      <Section title="Basics">
        <Field label="Name" required>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(autoSlug(e.target.value));
            }}
            className={inputCls}
            placeholder="Shloimy's Grill"
          />
        </Field>
        <Field label="Slug (URL)" hint="Auto-filled from name. Must be unique.">
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            className={inputCls}
            placeholder="shloimys-grill"
          />
        </Field>
        <Field label="Category" required>
          <select name="category" defaultValue="meat" className={inputCls}>
            <option value="meat">Meat</option>
            <option value="dairy">Dairy</option>
            <option value="pareve">Pareve</option>
            <option value="mixed">Mixed</option>
          </select>
        </Field>
        <Field label="Description" hint="One or two lines shown on the listing.">
          <textarea name="description" rows={2} className={inputCls} />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Address" required>
          <input name="address" required className={inputCls} placeholder="1500 Coney Island Ave" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" required>
            <input name="city" required defaultValue="Brooklyn" className={inputCls} />
          </Field>
          <Field label="State" required>
            <input name="state" required defaultValue="NY" className={inputCls} />
          </Field>
          <Field label="Zip" required>
            <input name="zip" required className={inputCls} placeholder="11230" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" required>
            <input name="lat" required type="text" inputMode="decimal" className={inputCls} placeholder="40.6225" />
          </Field>
          <Field label="Longitude" required>
            <input name="lng" required type="text" inputMode="decimal" className={inputCls} placeholder="-73.9626" />
          </Field>
        </div>
        <p className="text-xs text-brand-700">
          Get lat/lng from Google Maps: right-click the pin → click the coordinates to copy them.
        </p>
      </Section>

      <Section title="Kashrus">
        <div className="grid grid-cols-2 gap-2">
          <Check name="shomer_shabbos" label="Shomer Shabbos" defaultChecked />
          <Check name="cholov_yisroel" label="Cholov Yisroel" />
          <Check name="pas_yisroel" label="Pas Yisroel" />
          <Check name="bishul_yisroel" label="Bishul Yisroel" />
        </div>
      </Section>

      <Section title="Hechsher" hint="A restaurant is defined by who certifies it.">
        <Field label="Certifying agency" required>
          <select name="certification_id" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Select an agency…
            </option>
            {certOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid through" hint="Certificate expiry, if known.">
            <input name="valid_through" type="date" className={inputCls} />
          </Field>
          <Field label="Certificate URL" hint="Link to the published cert.">
            <input name="certificate_url" type="url" className={inputCls} placeholder="https://…" />
          </Field>
        </div>
      </Section>

      <Section title="Contact & media">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input name="phone" className={inputCls} placeholder="(718) 555-0123" />
          </Field>
          <Field label="Website">
            <input name="website" type="url" className={inputCls} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Hero image URL">
          <input name="hero_image_url" type="url" className={inputCls} placeholder="https://…" />
        </Field>
        <Field label="Cuisine tags" hint="Comma-separated, e.g. steakhouse, glatt, grill">
          <input name="cuisine_tags" className={inputCls} placeholder="steakhouse, grill" />
        </Field>
        <Field label="Price level">
          <select name="price_level" defaultValue="" className={inputCls}>
            <option value="">—</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
        </Field>
      </Section>

      <Section title="Delivery links" hint="Paste the restaurant's page URL on each platform (optional).">
        <Field label="Uber Eats URL">
          <input name="url_ubereats" type="url" className={inputCls} placeholder="https://www.ubereats.com/store/…" />
        </Field>
        <Field label="DoorDash URL">
          <input name="url_doordash" type="url" className={inputCls} placeholder="https://www.doordash.com/store/…" />
        </Field>
        <Field label="Grubhub URL">
          <input name="url_grubhub" type="url" className={inputCls} placeholder="https://www.grubhub.com/restaurant/…" />
        </Field>
      </Section>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900"
        >
          Save as pending
        </button>
        <span className="text-xs text-brand-700">You&apos;ll verify it from the queue next.</span>
      </div>
    </form>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-500 focus:border-brand-500 focus:outline-none';

function Section({
  title,
  hint,
  children
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl bg-white p-4 shadow-sm">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
        {title}
      </legend>
      {hint && <p className="mb-2 text-xs text-brand-500">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-brand-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {hint && <span className="ml-1 text-xs text-brand-500">{hint}</span>}
      {children}
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-brand-100 px-3 py-2 text-sm text-brand-900">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}
