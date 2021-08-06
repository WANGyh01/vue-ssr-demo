import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export const createStore = () => {
  return new Vuex.Store({
    // 避免交叉请求造成的数据污染
    state: () => {
      return {
        posts: []
      }
    },
    mutations: {
      setPosts (state, data) {
        state.posts = data
      }
    },
    actions: {
      // 在服务端渲染期间必须让action返回一个promise，因为在这个过程中需要等这个action数据返回之后才能执行后续的渲染操作
      async getPosts ({ commit }) {
        const { data } = await axios.get('https://cnodejs.org/api/v1/topics')
        commit('setPosts', data.data)
      }
    }
  })
}
