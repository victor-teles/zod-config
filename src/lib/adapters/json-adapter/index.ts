import type { Adapter } from "../../../types";
import { filterByPrefixKey } from "../utils";
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { parse } from 'path'

export type JsonAdapterProps = {
  path: string;
  prefixKey?: string;
};

const ADAPTER_NAME = "json adapter";

export const jsonAdapter = ({ path, prefixKey }: JsonAdapterProps): Adapter => {
  return {
    name: ADAPTER_NAME,
    read: async () => {
      try {
        const data = await readFile(path, "utf-8");

        const parsedData = JSON.parse(data) || {};

        if (prefixKey) {
          return filterByPrefixKey(parsedData, prefixKey);
        }

        return parsedData;
      } catch (error) {
        throw new Error(
          `Failed to parse / read JSON file at ${path}: ${error instanceof Error ? error.message : error
          }`,
        );
      }
    },
    write: async (model) => {
      try {
        const data = JSON.stringify(model)
        const parsedPath = parse(path)
        const exists = await access(path)
          .then(() => true)
          .catch(() => false);

        if (!exists)
          await mkdir(parsedPath.dir, { recursive: true });

        await writeFile(path, data)
      } catch (error) {
        throw new Error(
          `Failed to write JSON file at ${path}: ${error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  };
};
