import { Document } from "@prismicio/client/types/documents";
import { NextApiRequest, NextApiResponse } from "next";
import { getPrismicClient } from "../../services/prismic";

export default async (req: NextApiRequest, res: NextApiResponse) => {

  const { token: ref, documentId } = req.query

  const redirect = await getPrismicClient(req)
    .getPreviewResolver(String(ref), String(documentId))
    .resolve((doc: Document) => {

      if (doc.type === 'post') {
        return `/post/${doc.uid}`
      }

      return '/'
    }, '/')

  if (!redirect) {
    return res.status(401).json({ error: 'Token invalid' })
  }

  res.setPreviewData({ ref })

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirect}" />
    <script>window.location.href ="${redirect}"</script>
    </head>`
  )

  return res.end()
}