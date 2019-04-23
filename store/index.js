import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import VueCookies from 'vue-cookies'

Vue.use(Vuex)

const cookieModule = VueCookies

const travisLocationsAPI = axios.create({
  baseURL: process.env.TRAVIS_API_ENDPOINT + '/location/v1',
  timeout: 10000
})

const travisStoreFinderAPI = axios.create({
  baseURL: process.env.TRAVIS_API_ENDPOINT + '/storefinder/v1',
  timeout: 10000
})

const getUserIP = function (method, url) {
  var xhr = new XMLHttpRequest()
  if ('withCredentials' in xhr) {
    // Most browsers.
    xhr.open(method, url, true)
  } else {
    // CORS not supported.
    console.log('The remote IP Fetch API has configured cross-origin headers incorrectly')
    xhr = null
  }
  return xhr
}

const store = new Vuex.Store({
  strict: true,
  state: {
    branches: [],
    /** currentBranch is storeFinder info and runs with location logic**/
    currentBranch: { // Fallback - no slug. Using slug as boolean conditional rendering
      region: 'Find Store', // Do not change this string. Used in expression matching in StoreFinder Button
      email: '',
      phone_number: '',
      street: '',
      city: '',
      state: '',
      zip_code: ''
    },
    preferredBranch: {}, // holds user's favorited branch (cookie for now)
    mapBranch: {}, // Holds the branch currently focused in branch map
    errorPrompt: false,
    errorNotice: [],
    posts: {
      all: [
        {
          id: '5555',
          title: 'title man',
          subtitle: 'subtitle man',
          body: 'this is the body'
        },
        {
          id: '2222',
          title: 'title man',
          subtitle: 'subtitle man',
          body: 'this is the body'
        },
        {
          id: '1111',
          title: 'title man',
          subtitle: 'subtitle man',
          body: 'this is the body'
        }
      ]
    }
  },

  getters: {
    getBranches: state => { return state.branches },
    getCurrentBranch: state => { return state.currentBranch },
    getPreferredBranch: state => { return state.preferredBranch },
    getMapBranch: state => { return state.mapBranch },
    getErrorPrompt: state => { return state.errorPrompt },
    getErrorNotice: state => { return state.errorNotice }
  },

  mutations: {

    SET_BRANCHES (state, branches) {
      state.branches = branches.sort(function (a, b) {
        if (a.name < b.name) { return -1 }
        if (a.name > b.name) { return 1 }
      })

      for (let k = 0; k < state.branches.length; k++) {
        // Parse out extended zip codes
        state.branches[k].zip_code = state.branches[k].zip_code.substring(0, 5)
        // Add AP and AR property to all branches
        state.branches[k].email_AP = process.env.TRAVIS_ACCTS_PAYABLE_EMAIL
        state.branches[k].email_AR = process.env.TRAVIS_ACCTS_RECEIVABLE_EMAIL
        // Add customer support link to all branches
        state.branches[k].support_link = process.env.TRAVIS_SUPPORT_LINK
      }
    },
    SET_CURRENT_BRANCH (state, storeFinderResponse) {
      for (let i = 0; i < state.branches.length; i++) {
        if (state.branches[i].slug === storeFinderResponse.store_id) {
          state.currentBranch = state.branches[i]
        }
      }
    },
    SET_PREFERRED_BRANCH (state, payload) {
      state.preferredBranch = payload
    },
    CHANGE_CURRENT_BRANCH (state, payload) {
      state.currentBranch = payload
    },
    CHANGE_MAP_BRANCH (state, payload) {
      state.mapBranch = payload
    },
    SET_ERROR_PROMPT (state, toggle) {
      state.errorPrompt = !state.errorPrompt
    },
    CLOSE_ERROR_PROMPT (state, payload) {
      state.errorPrompt = false
    },
    SET_ERROR_NOTICE (state, msg) {
      state.errorNotice.push(msg)
    },
    CLEAR_ERROR_NOTICE (state, payload) {
      state.errorNotice = []
    }
  },

  actions: {

    fetchBranches (context) {
      travisLocationsAPI.get('/branches/').then((response) => {
        context.commit('SET_BRANCHES', response.data)
      })
    },

    determineClosestBranch (context, overridePreferred) {
      // If user has set preferredBranch, use that. Otherwise run location logic
      if (cookieModule.get('user_preferred_branch') && !overridePreferred) {
        /* hit location api for direct result (does not rely on async fetchBranches) */
        travisLocationsAPI.get('/branches/' + cookieModule.get('user_preferred_branch')).then((response) => {
          // Add in additional data, then commit
          response.data.zip_code = response.data.zip_code.substring(0, 5)
          response.data.email_AP = process.env.TRAVIS_ACCTS_PAYABLE_EMAIL
          response.data.email_AR = process.env.TRAVIS_ACCTS_RECEIVABLE_EMAIL
          response.data.support_link = process.env.TRAVIS_SUPPORT_LINK
          context.commit('CHANGE_CURRENT_BRANCH', response.data)
          context.commit('SET_PREFERRED_BRANCH', response.data)
        })
          .catch(function (error) {
          // fall back to matching from async call to fetchBranches
            console.log(error)
            let payload = {}
            payload.store_id = cookieModule.get('user_preferred_branch')
            context.commit('SET_CURRENT_BRANCH', payload)
            context.commit('SET_PREFERRED_BRANCH', cookieModule.get('user_preferred_branch'))
          })
      } else {
        // # 1 check for Geolocation support.
        if (!navigator.geolocation) {
          context.commit('SET_ERROR_NOTICE', 'Geolocation not supported in this browser')
          console.log('GeoLocation not supported')
        }

        // # 2 - try to get and send coords
        navigator.geolocation.getCurrentPosition(function (userLocation) {
          let longitude = userLocation.coords.longitude
          let latitude = userLocation.coords.latitude
          travisStoreFinderAPI.get('/coords?longitude=' + longitude + '&latitude=' + latitude)
            .then((response) => {
              context.commit('SET_CURRENT_BRANCH', response.data)
            })
            .catch(function (error) {
            // Case where we got coords, but storefinder http request failed
            /* #1 - Set error */
              context.commit('SET_ERROR_NOTICE', 'We had trouble while searching for nearby stores')
              console.log(error.stack) // ESLint demands you do something with error

              /* #2 - Prompt user to Select store */
              context.commit('SET_ERROR_PROMPT', true)
            })
        },
        function (error) {
          // Case where we failed to get coords

          /* #1 - Set error for Geolocation failure */
          let notice = 'Geolocation failed: '
          switch (error.code) {
            case error.PERMISSION_DENIED:
              notice += 'User denied sharing position'
              context.commit('SET_ERROR_NOTICE', notice)
              break
            case error.POSITION_UNAVAILABLE:
              notice += 'Location information is unavailable'
              context.commit('SET_ERROR_NOTICE', notice)
              break
            case error.TIMEOUT:
              notice += 'The request to get user location timed out'
              context.commit('SET_ERROR_NOTICE', notice)
              break
            case error.UNKNOWN_ERROR:
              notice += 'An unknown error occurred'
              context.commit('SET_ERROR_NOTICE', notice)
              break
          }

          /* #2 - Try to fetch with ip */
          let fetchIPAPI = process.env.IP_FETCH_API
          let method = 'GET'
          let xhr = getUserIP(method, fetchIPAPI)

          xhr.onload = function () {
            // Case where API successfully returned IP
            travisStoreFinderAPI.get('/ip/' + xhr.responseText)
              .then((response) => {
                context.commit('SET_CURRENT_BRANCH', response.data)
              })
              .catch(function (error) {
              // Case where we got ip, but storefinder http request failed
              /* #1 - Set error */
                context.commit('SET_ERROR_NOTICE', 'We found you, but not ourselves')
                console.log(error.stack) // ESLint demands you do something with error

                /* #2 - Prompt user to Select store */
                context.commit('SET_ERROR_PROMPT', true)
              })
          }

          xhr.onerror = function () {
            // Case where API failed to return IP
            /* #1 - Set error */
            context.commit('SET_ERROR_NOTICE', 'Unable to get your current IP Address')

            /* #2 - Prompt user to Select store */
            context.commit('SET_ERROR_PROMPT', true)
          }

          // Async XMLHttpRequest
          xhr.send()
        }) // END PROMISE ERROR HANDLER
      }
    },
    setPreferredBranch (context, payload) {
      // First - set preferred branch
      context.commit('SET_PREFERRED_BRANCH', payload)

      // Second - change current branch to preferred branch
      context.commit('CHANGE_CURRENT_BRANCH', payload)

      // Third - Generate or update a cookie(-1: never expire)
      cookieModule.set('user_preferred_branch', payload.slug, -1, null, window.location.hostname, false)
    },
    changeCurrentBranch (context, payload) {
      context.commit('CHANGE_CURRENT_BRANCH', payload)
    },
    changeMapBranch (context, payload) {
      context.commit('CHANGE_MAP_BRANCH', payload)
    },
    notifyUserError (context, msg) {
      context.commit('SET_ERROR_NOTICE', msg)
    },
    clearUserError (context) {
      context.commit('CLEAR_ERROR_NOTICE', '')
    },
    closeErrorPrompt (context) {
      context.commit('CLOSE_ERROR_PROMPT', '')
    },
    mapBranchInit (context) {
      // Get URI
      let pathToCheck = String(window.location.href).replace(/[`~!@#$%^&*()_|+=?;:'",.<>{}[\]\\]/gi, '')
      // Get pathname after endpoint /
      pathToCheck = pathToCheck.substr(pathToCheck.lastIndexOf('/') + 1)
      if (pathToCheck === 'branches') {

      } else {
        // let cookie = false // MOVE. preferredBranch cookie only checked on currentBranch, not mapBranch
        if (!pathToCheck || pathToCheck.length === 0) {
          // If nothing passed to end point, do not hit api.
          pathToCheck = 'no-branch'
          // redirect to /branches
          window.location.assign('/#/branches')
        } else {
          // Hit location API with pathToCheck (if invalid return, path was not a slug)
          travisLocationsAPI.get('/branches/' + pathToCheck).then((response) => {
            if (!response.data.detail) {
              // If valid return, commit change
              // But first, add in missing extra data, and fix zip code
              response.data.zip_code = response.data.zip_code.substring(0, 5)
              response.data.email_AP = process.env.TRAVIS_ACCTS_PAYABLE_EMAIL
              response.data.email_AR = process.env.TRAVIS_ACCTS_RECEIVABLE_EMAIL
              response.data.support_link = process.env.TRAVIS_SUPPORT_LINK
              context.commit('CHANGE_MAP_BRANCH', response.data)
            } else {
              // redirect to /branches
              window.location.assign('/#/branches')
            }
          })
            .catch(function (error) {
            // Something went wrong with first location API call, reroute to /branches
              console.log(error)
              window.location.assign('/#/branches')
            })
        }
      }
    } // END mapBranchInit
  }
})

export default () => {
  return store
}
