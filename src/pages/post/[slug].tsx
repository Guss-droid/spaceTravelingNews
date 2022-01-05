import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Giscus } from '@giscus/react';
import { ExitButton } from '../../components/ExitButton';
import { FiClock, FiUser, FiCalendar } from 'react-icons/fi'

import commons from '../../styles/common.module.scss'
import styles from './post.module.scss';

interface PostProps {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date?: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Posts {
  post: PostProps;
  previousPost?: PostProps;
  nextPost?: PostProps;
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  previousPost,
  preview
}: Posts) {

  const wordsTotal = post.data.content.reduce((total, item) => {

    total += item.heading.split(' ').length
    const wordsBody = item.body.map(bodyText => bodyText.text.split(' ').length)
    wordsBody.map(word => (total += word))

    return total
  }, 0)

  const reading = Math.ceil(wordsTotal / 200)

  const router = useRouter()

  if (router.isFallback) {
    return <h1 className={styles.loadingPage}>Carregando...</h1>
  }

  const formatDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  )

  const editedDate = format(
    new Date(post.last_publication_date),
    `dd MMM yyy', às 'HH:mm`,
    {
      locale: ptBR
    }
  )

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>

      <main className={styles.container}>

        <div className={styles.postContent}>
          <img src={post.data.banner.url} alt="Banner do post" />

          <h1>{post.data.title}</h1>
          <div className={commons.infoPost}>
            <FiCalendar />
            <time>{formatDate}</time>

            <FiUser />
            <p>{post.data.author}</p>

            <FiClock />
            <p>{`${reading} min`}</p>
          </div>
          {post.last_publication_date === post.first_publication_date
            ?
            <></>
            :
            <p className={styles.infoEdited}>* editado em {editedDate}</p>
          }
          {post.data.content.map((cont, i) => (
            <article key={i} className={styles.text}>
              <h1>{cont.heading}</h1>
              <div
                className={styles.textContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(cont.body) }}
              />
            </article>
          ))}
        </div>

        <div className={styles.footerContent}>
          <nav
            className={styles.postsNavigation}
            style={{ flexDirection: previousPost ? 'row' : 'row-reverse' }}
          >
            {previousPost && (
              <Link href={`/post/${previousPost.uid}`}>
                <a className={styles.previousPost}>
                  {previousPost.data.title}
                  <span>Post anterior</span>
                </a>
              </Link>
            )}

            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}>
                <a className={styles.nextPost}>
                  {nextPost.data.title}
                  <span>Próximo post</span>
                </a>
              </Link>
            )}

          </nav>
          <Giscus
            repo="Guss-droid/spaceTravelingNews"
            repoId="R_kgDOGkb-gw"
            mapping="pathname"
            reactionsEnabled="1"
            emitMetadata="1"
            theme="dark"
          />
          {preview && <ExitButton haveStyles={styles.exitPreview} />}
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  const prismic = getPrismicClient()
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  )

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }))

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {}
}) => {

  const prismic = getPrismicClient();
  const { slug } = params

  const res = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null
  });

  if (!res) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }

  const previousRes = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
      after: res.id,
      orderings: '[document.first_publication_date desc]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  )

  const nextRes = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
      after: res.id,
      orderings: '[document.first_publication_date]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  )

  const post = {
    uid: res.uid,
    first_publication_date: res.first_publication_date,
    last_publication_date: res.last_publication_date,
    data: {
      title: res.data.title,
      author: res.data.author,
      subtitle: res.data.subtitle,
      banner: {
        url: res.data.banner.url
      },
      content: res.data.content.map(cont => ({
        heading: cont.heading,
        body: [...cont.body]
      }))
    }
  }

  return {
    props: {
      post,
      previousPost: previousRes.results.length ? {
        uid: previousRes.results[0].uid,
        data: { title: previousRes.results[0].data.title },
      } : null,
      nextPost: nextRes.results.length ? {
        uid: nextRes.results[0].uid,
        data: { title: nextRes.results[0].data.title },
      } : null,
      preview
    }
  }
};