import type { AnyZodObject, z } from "zod";
import type { Adapter, Config } from "../types";
import { deepMerge } from "./adapters/utils";

/**
 * Load config from adapters.
 *
 * - If no adapters are provided, we will read from process.env.
 * - If multiple adapters are provided, we will deep merge the data from all adapters, with the last adapter taking precedence.
 * - If any adapter fails, we will still return the data from other adapters.
 * @param config
 * @returns parsed config
 */
export const loadConfig = async <T extends AnyZodObject>(
  config: Config<T>,
): Promise<z.infer<T>> => {
  const { adapters } = config;

  // Read data from adapters
  const data = await getDataFromAdapters(
    Array.isArray(adapters) ? adapters : adapters ? [adapters] : [],
  );

  return validateSchema(config, data);
};

export const writeConfig = async <T extends AnyZodObject>(
  model: z.infer<T>,
  config: Config<T>,
): Promise<z.infer<T>> => {
  const { adapters } = config;
  // Validate data against schema
  const data = validateSchema(config, model);

  await writeDataToAdapters(data, Array.isArray(adapters) ? adapters : adapters ? [adapters] : [],);

  return data;
};

const validateSchema = <T extends AnyZodObject>(config: Config<T>, data: any) => {
  const { schema, onError, onSuccess } = config;

  const result = schema.safeParse(data);

  if (!result.success) {
    // If onError callback is provided, we will call it with the error
    if (onError) {
      onError(result.error);

      return {};
    }

    throw result.error;
  }

  // If onSuccess callback is provided, we will call it with the parsed data
  if (onSuccess) {
    onSuccess(result.data);
  }

  return result.data;
};

const getDataFromAdapters = async (adapters?: Adapter[]) => {
  // If no adapters are provided, we will read from process.env
  if (!adapters || adapters.length === 0) {
    return process.env;
  }

  // Load data from all adapters, if any adapter fails, we will still return the data from other adapters
  const promiseResult = await Promise.all(
    adapters.map(async (adapter) => {
      try {
        return await adapter.read();
      } catch (error) {
        console.warn(
          `Cannot read data from ${adapter.name}: ${error instanceof Error ? error.message : error
          }`,
        );
        return {};
      }
    }),
  );

  // Perform deep merge of data from all adapters
  return deepMerge({}, ...promiseResult);
};

const writeDataToAdapters = async <T extends AnyZodObject>(
  data: z.infer<T>,
  adapters?: Adapter[],
) => {
  if (!adapters || adapters.length === 0) {
    return;
  }

  const promiseResult = await Promise.all(
    adapters.map(async (adapter) => {
      try {
        return await adapter.write(data);
      } catch (error) {
        console.warn(
          `Cannot write data to ${adapter.name}: ${error instanceof Error ? error.message : error}`,
        );
        return {};
      }
    }),
  );

  // Perform deep merge of data from all adapters
  return deepMerge({}, ...promiseResult);
};
