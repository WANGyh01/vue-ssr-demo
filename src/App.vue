<template>
	<div id="app">
		<h1>客户端动态交互</h1>
		<h2>{{ message }}</h2>
		<div>
			<label>
				<input v-model="message">
			</label>
		</div>
		<div>
			<button @click="onClick">点击测试</button>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'App',
		data () {
			return {
				message: '你好 Vue ssr'
			}
		},
		methods: {
			onClick () {
				console.log('Hello World')
			}
		}
	}
</script>

<style scoped>

</style>
