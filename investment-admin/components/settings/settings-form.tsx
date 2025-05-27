import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Setting, SettingType } from "@/types/setting";

// Form validation schema
const formSchema = z.object({
  key: z
    .string()
    .min(3, "Key must be at least 3 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Key must contain only lowercase letters, numbers and underscores"
    ),
  value: z.string(),
  type: z.nativeEnum(SettingType),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  group: z.string().min(1, "Group is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingFormProps {
  onSubmit: (data: Partial<Setting>) => Promise<boolean>;
  onCancel: () => void;
  existingGroups: string[];
}

export function SettingForm({
  onSubmit,
  onCancel,
  existingGroups,
}: SettingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomGroup, setShowCustomGroup] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
      value: "",
      type: SettingType.STRING,
      display_name: "",
      description: "",
      group: existingGroups.length > 0 ? existingGroups[0] : "",
    },
  });

  const selectedType = form.watch("type");

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const success = await onSubmit(data);
    setIsSubmitting(false);

    if (success) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. site_name" {...field} />
                </FormControl>
                <FormDescription>
                  Unique identifier for the setting
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SettingType.STRING}>String</SelectItem>
                    <SelectItem value={SettingType.NUMBER}>Number</SelectItem>
                    <SelectItem value={SettingType.BOOLEAN}>Boolean</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Site Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of this setting"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group</FormLabel>
                {showCustomGroup ? (
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="New group name" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomGroup(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomGroup(true)}
                    >
                      New
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  {selectedType === SettingType.BOOLEAN ? (
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={field.value === "true"}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? "true" : "false");
                        }}
                      />
                      <span>
                        {field.value === "true" ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  ) : selectedType === SettingType.NUMBER ? (
                    <Input type="number" {...field} />
                  ) : (
                    <Input type="text" {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Setting
          </Button>
        </div>
      </form>
    </Form>
  );
}
