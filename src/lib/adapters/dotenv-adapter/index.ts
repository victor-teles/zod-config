import { parse } from "dotenv";
import { readFile } from "fs/promises";
import type { Adapter } from "../../../types";
import { filterByPrefixKey } from "../utils";

export type DotEnvAdapterProps = {
  path: string;
  prefixKey?: string;
};

const ADAPTER_NAME = "dotenv adapter";

export const dotEnvAdapter = ({ path, prefixKey }: DotEnvAdapterProps): Adapter => {
  return {
    name: ADAPTER_NAME,
    read: async () => {
      try {
        const data = await readFile(path, "utf-8");

        const parsedData = parse(data) || {};

        if (prefixKey) {
          return filterByPrefixKey(parsedData, prefixKey);
        }

        return parsedData;
      } catch (error) {
        throw new Error(
          `Failed to parse / read .env file at ${path}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    },
    write: () => Promise.resolve()
  };
};
