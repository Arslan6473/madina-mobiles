"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type FieldErrors, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { saveSettingsAction } from "@/actions/admin";
import { settingsSchema, type SettingsInput } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { StoreSettingsDTO } from "@/types";
import { Field, SwitchRow } from "./field";
import { ImageUploader } from "./image-uploader";

type SettingsParsed = z.output<typeof settingsSchema>;

const TABS = [
  { value: "store", label: "Store", fields: ["storeName", "tagline", "ownerName", "logo", "currency", "currencySymbol"] },
  { value: "contact", label: "Contact", fields: ["phone", "whatsapp", "email", "address", "city", "country", "social"] },
  { value: "delivery", label: "Delivery", fields: ["deliveryCharge", "freeDeliveryThreshold", "announcement", "announcementEnabled"] },
  { value: "homepage", label: "Homepage", fields: ["homepage"] },
] as const;

function tabWithError(errors: FieldErrors<SettingsInput>) {
  const keys = Object.keys(errors);
  return TABS.find((t) => t.fields.some((f) => keys.includes(f)))?.value;
}

export function SettingsForm({ settings, cloudinaryEnabled }: { settings: StoreSettingsDTO; cloudinaryEnabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<string>("store");

  const form = useForm<SettingsInput, unknown, SettingsParsed>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: settings.storeName,
      tagline: settings.tagline ?? "",
      ownerName: settings.ownerName ?? "",
      logo: settings.logo ?? null,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email ?? "",
      address: settings.address,
      city: settings.city,
      country: settings.country,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      deliveryCharge: settings.deliveryCharge,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      announcement: settings.announcement ?? "",
      announcementEnabled: settings.announcementEnabled,
      social: {
        facebook: settings.social?.facebook ?? "",
        instagram: settings.social?.instagram ?? "",
        tiktok: settings.social?.tiktok ?? "",
        youtube: settings.social?.youtube ?? "",
      },
      homepage: {
        heroTitle: settings.homepage?.heroTitle ?? "",
        heroSubtitle: settings.homepage?.heroSubtitle ?? "",
        heroCtaLabel: settings.homepage?.heroCtaLabel ?? "",
        wholesaleTitle: settings.homepage?.wholesaleTitle ?? "",
        wholesaleText: settings.homepage?.wholesaleText ?? "",
      },
    },
  });
  const { register, control, formState, setError } = form;
  const errors = formState.errors;

  const [deliveryCharge, threshold, currencySymbol, currency] = useWatch({
    control,
    name: ["deliveryCharge", "freeDeliveryThreshold", "currencySymbol", "currency"],
  });
  const money = (v: unknown) => formatPrice(Number(v) || 0, { currency: String(currency || "PKR"), currencySymbol: String(currencySymbol || "Rs") });
  const thresholdNum = Number(threshold) || 0;

  const onSubmit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const res = await saveSettingsAction(values);
        if (!res.ok) {
          for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
            if (v?.[0]) setError(k as FieldPath<SettingsInput>, { message: v[0] });
          const t = tabWithError(Object.fromEntries(Object.keys(res.fieldErrors ?? {}).map((k) => [k, true])) as never);
          if (t) setTab(t);
          toast.error(res.error);
          return;
        }
        toast.success("Settings saved. The store has been updated.");
        router.refresh();
      }),
    (errs) => {
      const t = tabWithError(errs);
      if (t) setTab(t);
      toast.error("Please fix the highlighted fields.");
    },
  );

  const err = (k: keyof SettingsInput) => !!errors[k];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            {TABS.map((t) => {
              const hasError = t.fields.some((f) => f in errors);
              return (
                <TabsTrigger key={t.value} value={t.value} className="px-3">
                  {t.label}
                  {hasError && <span className="size-1.5 rounded-full bg-destructive" aria-label="has errors" />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* ---------------------------------- Store --------------------------------- */}
        <TabsContent value="store" keepMounted className="grid gap-4 data-hidden:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Store details</CardTitle>
              <CardDescription>Shown in the header, footer, invoices and search results.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name" htmlFor="storeName" required error={errors.storeName?.message}>
                <Input id="storeName" aria-invalid={err("storeName")} {...register("storeName")} />
              </Field>
              <Field label="Owner name" htmlFor="ownerName" error={errors.ownerName?.message}>
                <Input id="ownerName" {...register("ownerName")} />
              </Field>
              <Field label="Tagline" htmlFor="tagline" className="sm:col-span-2" error={errors.tagline?.message}>
                <Input id="tagline" maxLength={120} {...register("tagline")} />
              </Field>
              <Field label="Currency code" htmlFor="currency" required error={errors.currency?.message} hint="e.g. PKR">
                <Input id="currency" maxLength={5} className="uppercase" aria-invalid={err("currency")} {...register("currency")} />
              </Field>
              <Field label="Currency symbol" htmlFor="currencySymbol" required error={errors.currencySymbol?.message} hint="e.g. Rs">
                <Input id="currencySymbol" maxLength={5} aria-invalid={err("currencySymbol")} {...register("currencySymbol")} />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Logo</CardTitle>
              <CardDescription>
                Optional. Without a logo the store shows the MADINA wordmark. A square or wide PNG with a transparent background works best.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="logo"
                render={({ field }) => (
                  <ImageUploader
                    value={field.value ? [field.value] : []}
                    onChange={(imgs) => field.onChange(imgs[0] ?? null)}
                    folder="branding"
                    max={1}
                    showAlt={false}
                    cloudinaryEnabled={cloudinaryEnabled}
                  />
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------- Contact -------------------------------- */}
        <TabsContent value="contact" keepMounted className="grid gap-4 data-hidden:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Contact details</CardTitle>
              <CardDescription>Customers use these to call, WhatsApp or visit you.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
                <Input id="phone" type="tel" inputMode="tel" aria-invalid={err("phone")} {...register("phone")} />
              </Field>
              <Field label="WhatsApp number" htmlFor="whatsapp" required error={errors.whatsapp?.message} hint="Used for all WhatsApp buttons on the store.">
                <Input id="whatsapp" type="tel" inputMode="tel" aria-invalid={err("whatsapp")} {...register("whatsapp")} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email?.message} className="sm:col-span-2">
                <Input id="email" type="email" aria-invalid={err("email")} {...register("email")} />
              </Field>
              <Field label="Address" htmlFor="address" required error={errors.address?.message} className="sm:col-span-2">
                <Input id="address" aria-invalid={err("address")} {...register("address")} />
              </Field>
              <Field label="City" htmlFor="city" required error={errors.city?.message}>
                <Input id="city" aria-invalid={err("city")} {...register("city")} />
              </Field>
              <Field label="Country" htmlFor="country" required error={errors.country?.message}>
                <Input id="country" aria-invalid={err("country")} {...register("country")} />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Social links</CardTitle>
              <CardDescription>Full URLs. Leave empty to hide an icon.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {(["facebook", "instagram", "tiktok", "youtube"] as const).map((s) => (
                <Field key={s} label={s === "tiktok" ? "TikTok" : s === "youtube" ? "YouTube" : s[0].toUpperCase() + s.slice(1)} htmlFor={`social-${s}`} error={errors.social?.[s]?.message}>
                  <Input id={`social-${s}`} type="url" placeholder="https://" aria-invalid={!!errors.social?.[s]} {...register(`social.${s}`)} />
                </Field>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------- Delivery ------------------------------- */}
        <TabsContent value="delivery" keepMounted className="grid gap-4 data-hidden:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Delivery charges</CardTitle>
              <CardDescription>All orders are Cash on Delivery.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery charge" htmlFor="deliveryCharge" required error={errors.deliveryCharge?.message} hint="Flat fee added to every order.">
                <Input id="deliveryCharge" type="number" min={0} step={1} aria-invalid={err("deliveryCharge")} {...register("deliveryCharge")} />
              </Field>
              <Field
                label="Free delivery above"
                htmlFor="freeDeliveryThreshold"
                required
                error={errors.freeDeliveryThreshold?.message}
                hint="Set to 0 to turn free delivery off."
              >
                <Input id="freeDeliveryThreshold" type="number" min={0} step={1} aria-invalid={err("freeDeliveryThreshold")} {...register("freeDeliveryThreshold")} />
              </Field>
              <p className="rounded-lg bg-muted/60 p-3 text-sm sm:col-span-2">
                {thresholdNum > 0 ? (
                  <>
                    Orders with a subtotal of <strong>{money(thresholdNum)}</strong> or more get free delivery. Smaller orders pay{" "}
                    <strong>{money(deliveryCharge)}</strong>.
                  </>
                ) : (
                  <>
                    Free delivery is <strong>off</strong>. Every order pays <strong>{money(deliveryCharge)}</strong> delivery.
                  </>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Announcement bar</CardTitle>
              <CardDescription>A short message at the very top of every store page.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Controller
                control={control}
                name="announcementEnabled"
                render={({ field }) => (
                  <SwitchRow
                    label="Show announcement"
                    description="Turn off to hide the bar without losing the text."
                    control={<Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                  />
                )}
              />
              <Field label="Announcement text" htmlFor="announcement" error={errors.announcement?.message}>
                <Input id="announcement" maxLength={200} placeholder="e.g. Free delivery all over Pakistan on orders above Rs 3,000" {...register("announcement")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------- Homepage ------------------------------- */}
        <TabsContent value="homepage" keepMounted className="grid gap-4 data-hidden:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Hero section</CardTitle>
              <CardDescription>The large banner at the top of the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Heading" htmlFor="heroTitle" required error={errors.homepage?.heroTitle?.message}>
                <Input id="heroTitle" maxLength={120} aria-invalid={!!errors.homepage?.heroTitle} {...register("homepage.heroTitle")} />
              </Field>
              <Field label="Subheading" htmlFor="heroSubtitle" error={errors.homepage?.heroSubtitle?.message}>
                <Textarea id="heroSubtitle" rows={2} maxLength={300} {...register("homepage.heroSubtitle")} />
              </Field>
              <Field label="Button label" htmlFor="heroCtaLabel" required error={errors.homepage?.heroCtaLabel?.message} className="sm:max-w-xs">
                <Input id="heroCtaLabel" maxLength={30} aria-invalid={!!errors.homepage?.heroCtaLabel} {...register("homepage.heroCtaLabel")} />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Wholesale section</CardTitle>
              <CardDescription>Invites shopkeepers to contact you for bulk prices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Title" htmlFor="wholesaleTitle" error={errors.homepage?.wholesaleTitle?.message}>
                <Input id="wholesaleTitle" maxLength={120} {...register("homepage.wholesaleTitle")} />
              </Field>
              <Field label="Text" htmlFor="wholesaleText" error={errors.homepage?.wholesaleText?.message}>
                <Textarea id="wholesaleText" rows={3} maxLength={400} {...register("homepage.wholesaleText")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Button type="submit" disabled={pending} className="bg-navy hover:bg-navy/90">
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
