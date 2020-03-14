import { NowRequest, NowResponse } from "@now/node"
import main from "./index"

export default async function(req: NowRequest, res: NowResponse) {
  return await main(req, res)
}
