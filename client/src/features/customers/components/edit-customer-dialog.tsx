"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  X,
  Plus,
  Loader2,
  User,
  Tags,
  FileText,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  updateCustomerSchema,
  type UpdateCustomerInput,
} from "../schemas/customer.schema";
import { useUpdateCustomer } from "../hooks/use-update-customer";
import type { Customer } from "../types/customer.types";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  initialTab?: "profile" | "tags" | "notes";
}

const SUGGESTED_TAGS = [
  "VIP",
  "Repeat Buyer",
  "High Value",
  "Modest Style",
  "Evening Wear",
  "Wholesale",
  "Loyal",
];

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  initialTab = "profile",
}: EditCustomerDialogProps) {
  if (!customer) return null;

  return (
    <EditCustomerDialogContent
      key={`${customer._id}-${initialTab}-${open}`}
      open={open}
      onOpenChange={onOpenChange}
      customer={customer}
      initialTab={initialTab}
    />
  );
}

interface EditCustomerDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  initialTab?: "profile" | "tags" | "notes";
}

function EditCustomerDialogContent({
  open,
  onOpenChange,
  customer,
  initialTab = "profile",
}: EditCustomerDialogContentProps) {
  // Translation
  const t = useTranslations();

  // State
  const [activeTab, setActiveTab] = React.useState<"profile" | "tags" | "notes">(initialTab);
  const [tagInput, setTagInput] = React.useState("");

  // Mutation
  const updateCustomerMutation = useUpdateCustomer();

  // Form & validation
  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      secondaryPhone: customer.secondaryPhone || "",
      tags: customer.tags ? [...customer.tags] : [],
      notes: customer.notes || "",
      socialProfiles: {
        whatsapp: customer.socialProfiles?.whatsapp || "",
        instagram: customer.socialProfiles?.instagram || "",
        facebook: customer.socialProfiles?.facebook || "",
      },
    },
  });

  // Variables
  const watchedTags = useWatch({ control: form.control, name: "tags" });
  const currentTags = watchedTags ?? [];
  const isPending = updateCustomerMutation.isPending;

  // Functions
  function handleAddTag(tagToAdd: string) {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("");
      return;
    }
    form.setValue("tags", [...currentTags, trimmed], { shouldDirty: true });
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove: string) {
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tagToRemove),
      { shouldDirty: true }
    );
  }

  async function onSubmit(data: UpdateCustomerInput) {
    const payload: UpdateCustomerInput = {
      fullName: data.fullName?.trim(),
      phone: data.phone?.trim(),
      email: data.email ? data.email.trim() : "",
      secondaryPhone: data.secondaryPhone ? data.secondaryPhone.trim() : "",
      tags: data.tags ?? [],
      notes: data.notes ?? "",
      socialProfiles: {
        whatsapp: data.socialProfiles?.whatsapp ? data.socialProfiles.whatsapp.trim() : "",
        instagram: data.socialProfiles?.instagram ? data.socialProfiles.instagram.trim() : "",
        facebook: data.socialProfiles?.facebook ? data.socialProfiles.facebook.trim() : "",
      },
    };

    try {
      await updateCustomerMutation.mutateAsync({
        id: customer._id,
        payload,
      });
      onOpenChange(false);
    } catch {
      // Error handled by hook's onError toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">
            {t("customers-edit-title") || "Edit Customer Profile"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {customer.fullName} • {customer.phone}
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b border-border/60 gap-1 pb-1">
          <Button
            type="button"
            variant={activeTab === "profile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("profile")}
            className="h-8 gap-1.5 text-xs"
          >
            <User className="size-3.5" />
            <span>{t("customers-tab-profile") || "Profile Details"}</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "tags" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tags")}
            className="h-8 gap-1.5 text-xs"
          >
            <Tags className="size-3.5" />
            <span>
              {t("customers-tab-tags") || "Tags"} ({currentTags.length})
            </span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "notes" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("notes")}
            className="h-8 gap-1.5 text-xs"
          >
            <FileText className="size-3.5" />
            <span>{t("customers-tab-notes") || "Internal Notes"}</span>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("customers-form-name") || "Full Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("customers-form-name-ph") || "Customer Name"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("customers-form-email") || "Email Address"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Primary Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("customers-form-phone") || "Primary Phone"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            placeholder="+20 100 000 0000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Secondary Phone */}
                  <FormField
                    control={form.control}
                    name="secondaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("customers-form-secondary-phone") || "Secondary Phone"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            placeholder="+20 110 000 0000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Social Profiles */}
                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-3">
                    <Share2 className="size-3.5 text-primary" />
                    <span>{t("customers-form-social") || "Social Profiles"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="socialProfiles.whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">WhatsApp</FormLabel>
                          <FormControl>
                            <Input dir="ltr" placeholder="+20..." {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialProfiles.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Instagram</FormLabel>
                          <FormControl>
                            <Input dir="ltr" placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialProfiles.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Facebook</FormLabel>
                          <FormControl>
                            <Input dir="ltr" placeholder="profile-url" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAGS TAB */}
            {activeTab === "tags" && (
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-xs mb-1.5 block">
                    {t("customers-form-tags-current") || "Customer Tags"}
                  </FormLabel>
                  <div className="flex flex-wrap gap-1.5 min-h-12 p-3 rounded-md border border-input bg-card/40">
                    {currentTags.length === 0 ? (
                      <span className="text-xs text-muted-foreground self-center">
                        {t("customers-form-tags-empty") || "No tags assigned yet."}
                      </span>
                    ) : (
                      currentTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 text-xs px-2.5 py-1"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Add new tag input */}
                <div>
                  <FormLabel className="text-xs mb-1.5 block">
                    {t("customers-form-tag-add") || "Add Custom Tag"}
                  </FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder={t("customers-form-tag-ph") || "Type a tag name and press Enter…"}
                      className="text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tagInput)}
                      className="h-9 gap-1 text-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>{t("customers-form-tag-btn") || "Add"}</span>
                    </Button>
                  </div>
                </div>

                {/* Suggested Quick Tags */}
                <div>
                  <span className="text-xs text-muted-foreground block mb-2">
                    {t("customers-form-suggested-tags") || "Quick Suggested Tags:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.map((sug) => {
                      const alreadyAdded = currentTags.some(
                        (t) => t.toLowerCase() === sug.toLowerCase()
                      );
                      return (
                        <button
                          key={sug}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddTag(sug)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            alreadyAdded
                              ? "opacity-40 cursor-not-allowed bg-muted/40 border-transparent text-muted-foreground"
                              : "hover:bg-primary/10 hover:border-primary/40 border-border text-foreground cursor-pointer"
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("customers-form-notes-label") || "Staff Internal Notes"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          placeholder={
                            t("customers-form-notes-ph") ||
                            "Add internal observations, delivery preferences, sizing notes, or VIP requests. (Only visible to authorized employees)"
                          }
                          className="resize-y text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        {t("customers-form-notes-privacy") ||
                          "Internal notes are strictly private to staff and never shown to the customer."}
                      </p>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border/60 flex items-center justify-between sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="text-xs"
              >
                {t("customers-action-cancel") || "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs gap-1.5"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>
                  {isPending
                    ? t("customers-action-saving") || "Saving…"
                    : t("customers-action-save") || "Save Changes"}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
