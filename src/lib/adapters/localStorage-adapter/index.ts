import type { Adapter } from "../../../types";
import { filterByPrefixKey } from "../utils";

export type LocalStorageAdapterProps = {
  key?: string;
  prefixKey?: string;
};

const ADAPTER_NAME = 'localStorage adapter';

export const localStorageAdapter = ({ key = 'zod', prefixKey }: LocalStorageAdapterProps): Adapter => {
  return {
    name: ADAPTER_NAME,
    read: async () => {
      try {
        const data = localStorage.getItem(key);
        const parsedData = data ? JSON.parse(data) : {};

        if (prefixKey) {
          return filterByPrefixKey(parsedData, prefixKey);
        }

        return parsedData;
      } catch (error) {
        throw new Error(
          `Failed to parse / read from LocalStorage with key ${key}: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
    write: async (model) => {
      try {
        const data = JSON.stringify(model)

       localStorage.setItem(key, data);
      } catch (error) {
        throw new Error(
          `Failed to write to LocalStorage with key ${key}: ${error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  };
};
