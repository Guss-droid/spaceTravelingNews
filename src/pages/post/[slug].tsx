import Head from 'next/head'
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiClock, FiUser, FiCalendar } from 'react-icons/fi'

import commons from '../../styles/common.module.scss'
import styles from './post.module.scss';

interface PostProps {
  first_publication_date: string | null;
  data: {
    title: string;
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
}

export default function Post({ post }: Posts) {

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

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const prismic = getPrismicClient();
  const { slug } = params

  const res = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: res.uid,
    first_publication_date: res.first_publication_date,
    data: {
      title: res.data.title,
      author: res.data.author,
      banner: {
        url: res.data.banner.url
      },
      content: res.data.content.map(cont => ({
        heading: cont.heading,
        body: [...cont.body]
      }))
    }
  }

  return { props: { post } }
};