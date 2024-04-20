import { readFile, writeFile, mkdir, access } from 'fs/promises';
import yaml from 'js-yaml';
import type { Adapter } from "../../../types";
import { filterByPrefixKey } from "../utils";
import { parse } from 'path'

export type YamlAdapterProps = {
  path: string;
  prefixKey?: string;
};

const ADAPTER_NAME = 'yaml adapter';

export const yamlAdapter = ({ path, prefixKey }: YamlAdapterProps): Adapter => {
  return {
    name: ADAPTER_NAME,
    read: async () => {
      try {
        const data = await readFile(path, 'utf-8');

        const parsedData = yaml.load(data) || {};

        if (prefixKey) {
          return filterByPrefixKey(parsedData, prefixKey);
        }

        return parsedData;
      } catch (error) {
        throw new Error(
          `Failed to parse / read YAML file at ${path}: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
    write: async (model) => {
      try {
        const data = yaml.dump(model)
        const parsedPath = parse(path)
        const exists = await access(path)
          .then(() => true)
          .catch(() => false);

        if (!exists)
          await mkdir(parsedPath.dir, { recursive: true });

        await writeFile(path, data)
      } catch (error) {
        throw new Error(
          `Failed to write YAML file at ${path}: ${error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  };
};
