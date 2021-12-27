import Head from 'next/head'
import Link from 'next/link'
import { GetStaticProps } from 'next';
import { useState } from 'react';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser } from 'react-icons/fi'

import commons from '../styles/common.module.scss'
import styles from './home.module.scss';

interface IPost {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface IPostPagination {
  next_page: string;
  results: IPost[]
}

interface IHomeProps {
  postsPagination: IPostPagination;
}

export default function Home({ postsPagination }: IHomeProps) {

  const [posts, setPosts] = useState<IPostPagination>({
    ...postsPagination,
    results: postsPagination.results.map(post => ({
      ...post,
      first_publication_date: post.first_publication_date
    })),
  })

  async function loadPosts() {

    const res = await fetch(`${posts.next_page}`)
      .then(data => data.json())

    setPosts({
      ...posts,
      results: [...posts.results, ...res.results],
      next_page: res.next_page
    })
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>

      <main className={styles.container}>

        <div className={styles.listPost}>
          {posts.results.map(res => (
            <Link key={res.uid} href={`/post/${res.uid}`}>
              <a>
                <h1>{res.data.title}</h1>
                <span className={styles.subtitle}>{res.data.subtitle}</span>
                <div className={commons.infoPost}>
                  <FiCalendar />
                  <time>{format(
                    new Date(res.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR
                    }
                  )}</time>

                  <FiUser />
                  <p>{res.data.author}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {posts.next_page && (
          <button
            className={styles.loadPostsBtn}
            type='button'
            onClick={loadPosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient()

  const res = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ], {
    pageSize: 1
  })

  const postsPagination = {
    next_page: res.next_page,
    results: res.results
  }

  return {
    props: { postsPagination }
  }
}