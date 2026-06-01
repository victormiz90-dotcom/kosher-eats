'use client';

import { useState } from 'react';
import { createRestaurant, updateRestaurant } from '@/app/admin/actions';

export interface RestaurantFormInitial {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: string;
  lng: string;
  shomer_shabbos: boolean;
  cholov_yisroel: boolean;
  pas_yisroel: boolean;
  bishul_yisroel: boolean;
  certification_id: string;
  valid_through: string;
  certificate_url: string;
  phone: string;
  website: string;
  hero_image_url: string;
  cuisine_tags: string;
  price_level: string;
  url_ubereats: string;
  url_doordash: string;
  url_grubhub: string;
}

export function RestaurantForm({
  certOptions,
  initial
}: {
  certOptions: { id: string; label: string }[];
  initial?: RestaurantFormInitial;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(isEdit);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const checkDefault = (key: keyof RestaurantFormInitial, createDefault: boolean) =>
    initial ? Boolean(initial[key]) : createDefault;

  return (
    <form action={isEdit ? updateRestaurant : createRestaurant} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

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
        <Field label="Slug (URL)" hint="Must be unique.">
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
          <select name="category" defaultValue={initial?.category ?? 'meat'} className={inputCls}>
            <option value="meat">Meat</option>
            <option value="dairy">Dairy</option>
            <option value="pareve">Pareve</option>
            <option value="mixed">Mixed</option>
          </select>
        </Field>
        <Field label="Description" hint="One or two lines shown on the listing.">
          <textarea name="description" rows={2} defaultValue={initial?.description ?? ''} className={inputCls} />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Address" required>
          <input name="address" required defaultValue={initial?.address ?? ''} className={inputCls} placeholder="1500 Coney Island Ave" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" required>
            <input name="city" required defaultValue={initial?.city ?? 'Brooklyn'} className={inputCls} />
          </Field>
          <Field label="State" required>
            <input name="state" required defaultValue={initial?.state ?? 'NY'} className={inputCls} />
          </Field>
          <Field label="Zip" required>
            <input name="zip" required defaultValue={initial?.zip ?? ''} className={inputCls} placeholder="11230" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" required>
            <input name="lat" required type="text" inputMode="decimal" defaultValue={initial?.lat ?? ''} className={inputCls} placeholder="40.6225" />
          </Field>
          <Field label="Longitude" required>
            <input name="lng" required type="text" inputMode="decimal" defaultValue={initial?.lng ?? ''} className={inputCls} placeholder="-73.9626" />
          </Field>
        </div>
        <p className="text-xs text-brand-500">
          Get lat/lng from Google Maps: right-click the pin → click the coordinates to copy them.
        </p>
      </Section>

      <Section title="Kashrus">
        <div className="grid grid-cols-2 gap-2">
          <Check name="shomer_shabbos" label="Shomer Shabbos" defaultChecked={checkDefault('shomer_shabbos', true)} />
          <Check name="cholov_yisroel" label="Cholov Yisroel" defaultChecked={checkDefault('cholov_yisroel', false)} />
          <Check name="pas_yisroel" label="Pas Yisroel" defaultChecked={checkDefault('pas_yisroel', false)} />
          <Check name="bishul_yisroel" label="Bishul Yisroel" defaultChecked={checkDefault('bishul_yisroel', false)} />
        </div>
      </Section>

      <Section title="Hechsher" hint={isEdit ? 'Updating the agency upserts the primary cert; existing certs are kept.' : 'A restaurant is defined by who certifies it.'}>
        <Field label="Certifying agency" required={!isEdit}>
          <select name="certification_id" required={!isEdit} defaultValue={initial?.certification_id ?? ''} className={inputCls}>
            <option value="" disabled={!isEdit}>
              {isEdit ? 'Keep / select an agency…' : 'Select an agency…'}
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
            <input name="valid_through" type="date" defaultValue={initial?.valid_through ?? ''} className={inputCls} />
          </Field>
          <Field label="Certificate URL" hint="Link to the published cert.">
            <input name="certificate_url" type="url" defaultValue={initial?.certificate_url ?? ''} className={inputCls} placeholder="https://…" />
          </Field>
        </div>
      </Section>

      <Section title="Contact & media">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input name="phone" defaultValue={initial?.phone ?? ''} className={inputCls} placeholder="(718) 555-0123" />
          </Field>
          <Field label="Website">
            <input name="website" type="url" defaultValue={initial?.website ?? ''} className={inputCls} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Hero image URL">
          <input name="hero_image_url" type="url" defaultValue={initial?.hero_image_url ?? ''} className={inputCls} placeholder="https://…" />
        </Field>
        <Field label="Cuisine tags" hint="Comma-separated, e.g. steakhouse, glatt, grill">
          <input name="cuisine_tags" defaultValue={initial?.cuisine_tags ?? ''} className={inputCls} placeholder="steakhouse, grill" />
        </Field>
        <Field label="Price level">
          <select name="price_level" defaultValue={initial?.price_level ?? ''} className={inputCls}>
            <option value="">—</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
        </Field>
      </Section>

      <Section title="Delivery links" hint="Paste the restaurant's page URL on each platform (clear a field to remove it).">
        <Field label="Uber Eats URL">
          <input name="url_ubereats" type="url" defaultValue={initial?.url_ubereats ?? ''} className={inputCls} placeholder="https://www.ubereats.com/store/…" />
        </Field>
        <Field label="DoorDash URL">
          <input name="url_doordash" type="url" defaultValue={initial?.url_doordash ?? ''} className={inputCls} placeholder="https://www.doordash.com/store/…" />
        </Field>
        <Field label="Grubhub URL">
          <input name="url_grubhub" type="url" defaultValue={initial?.url_grubhub ?? ''} className={inputCls} placeholder="https://www.grubhub.com/restaurant/…" />
        </Field>
      </Section>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900"
        >
          {isEdit ? 'Save changes' : 'Save as pending'}
        </button>
        <span className="text-xs text-brand-500">
          {isEdit ? 'Edits keep the current verification status.' : "You'll verify it from the queue next."}
        </span>
      </div>
    </form>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-500 focus:border-accent-500 focus:outline-none';

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
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-brand-500">
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
