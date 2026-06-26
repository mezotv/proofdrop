import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  DELETE_ASSET_TOOL_DESCRIPTION,
  DELETE_ASSET_TOOL_NAME,
  DELETE_ASSET_TOOL_TITLE,
  UPLOAD_ASSET_TOOL_DESCRIPTION,
  UPLOAD_ASSET_TOOL_NAME,
  UPLOAD_ASSET_TOOL_TITLE,
} from "../constants/tool.js";
import { deleteAssetInputShape, uploadAssetInputShape } from "../schemas/asset.js";
import { deleteAsset, uploadAsset } from "../services/asset-storage.js";
import type { DeleteAssetInput, UploadAssetInput } from "../types/asset.js";
import { callTool } from "../utils/tool-response.js";

export function registerAssetTools(server: McpServer): void {
  server.registerTool(
    UPLOAD_ASSET_TOOL_NAME,
    {
      title: UPLOAD_ASSET_TOOL_TITLE,
      description: UPLOAD_ASSET_TOOL_DESCRIPTION,
      inputSchema: uploadAssetInputShape,
    },
    async (input: UploadAssetInput) => callTool(() => uploadAsset(input)),
  );

  server.registerTool(
    DELETE_ASSET_TOOL_NAME,
    {
      title: DELETE_ASSET_TOOL_TITLE,
      description: DELETE_ASSET_TOOL_DESCRIPTION,
      inputSchema: deleteAssetInputShape,
    },
    async (input: DeleteAssetInput) => callTool(() => deleteAsset(input)),
  );
}
