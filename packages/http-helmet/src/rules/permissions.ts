import { kebabCase } from "change-case";
import type { LiteralUnion } from "type-fest";

type KnownPermissions = LiteralUnion<
  | "accelerometer"
  | "ambientLightSensor"
  | "autoplay"
  | "battery"
  | "camera"
  | "displayCapture"
  | "documentDomain"
  | "encryptedMedia"
  | "executionWhileNotRendered"
  | "executionWhileOutOfViewport"
  | "fullscreen"
  | "gamepad"
  | "geolocation"
  | "gyroscope"
  | "interestCohort"
  | "layoutAnimations"
  | "legacyImageFormats"
  | "magnetometer"
  | "microphone"
  | "midi"
  | "navigationOverride"
  | "oversizedImages"
  | "payment"
  | "pictureInPicture"
  | "publickeyCredentialsGet"
  | "speakerSelection"
  | "syncXhr"
  | "unoptimizedImages"
  | "unsizedMedia"
  | "usb"
  | "screenWakeLock"
  | "webShare"
  | "xrSpatialTracking",
  string
>;

export type PermissionsPolicy = {
  [key in KnownPermissions]?: Array<string>;
};

export const reservedPermissionKeywords = new Set(["self", "*"]);

export function createPermissionsPolicy(features: PermissionsPolicy): string {
  return Object.entries(features)
    .map(([key, featureValues]) => {
      if (!Array.isArray(featureValues)) {
        throw new Error(
          `[createPermissionsPolicy]: The value of the "${key}" feature must be array of strings.`,
        );
      }

      const allowedValuesSeen: Set<string> = new Set();

      for (let allowedValue of featureValues) {
        if (typeof allowedValue !== "string") {
          throw new Error(
            `[createPermissionsPolicy]: The value of "${key}" contains a non-string, which is not supported.`,
          );
        }

        if (allowedValuesSeen.has(allowedValue)) {
          throw new Error(
            `[createPermissionsPolicy]: The value of "${key}" contains duplicates, which it shouldn't.`,
          );
        }

        if (allowedValue === "'self'") {
          throw new Error(
            `[createPermissionsPolicy]: self must not be quoted for "${key}".`,
          );
        }

        allowedValuesSeen.add(allowedValue);
      }

      if (featureValues.length > 1 && allowedValuesSeen.has("*")) {
        throw new Error(
          `[createPermissionsPolicy]: The value of the "${key}" feature cannot contain * and other values.`,
        );
      }

      const featureKeyDashed = kebabCase(key);
      const featureValuesUnion = featureValues
        .map((value) => {
          if (reservedPermissionKeywords.has(value)) {
            return value;
          }

          return `"${value}"`;
        })
        .join(" ");

      if (featureValuesUnion === "*") {
        return `${featureKeyDashed}=${featureValuesUnion}`;
      }

      return `${featureKeyDashed}=(${featureValuesUnion})`;
    })
    .join(", ");
}
