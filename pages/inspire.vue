<template>
  <v-layout>
    <v-flex text-xs-center>
      <img src="/v.png" alt="Vuetify.js" class="mb-5">
      <blockquote class="blockquote">
        &#8220;First, solve the problem. Then, write the code.&#8221;
        <footer>
          <small>
            <em>&mdash;John Johnson</em>
          </small>
        </footer>
      </blockquote>
    </v-flex>
  </v-layout>
</template>

<script>
import axios from 'axios'
export default {
  async asyncData ({ params, app }) {
    const travisHowlerAPI = axios.create({
      baseURL: process.env.TRAVIS_HOWLER_API,
      headers: {
        'Authorization': process.env.TRAVIS_HOWLER_API_TOKEN
      },
      timeout: 15000
    })
    const { data } = await travisHowlerAPI.get('/post/' + '3ea65d90-f4ba-477e-b47d-2350d4151d72')
    return { post: data, post2: data }
  },
  head () {
    return {
      title: this.post.title
    }
  },
  mounted () {
    console.log({
      laksdjf: this
    })
  }
}
</script>

<style lang="css">
</style>
