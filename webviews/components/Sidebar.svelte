<script lang="ts">
  import { onMount } from "svelte";
  import MemeContainer from "./MemeContainer.svelte";
  let visitedMemes: {
    url: string;
    title: string;
    author: string;
    ups: number;
    postLink: string;
    subreddit: string;
  }[] = [];
  class Meme {
    url: string;
    title: string;
    author: string;
    ups: number;
    postLink: string;
    subreddit: string;
    constructor(
      url: string,
      title: string,
      author: string,
      ups: number,
      postLink: string,
      subreddit: string
    ) {
      this.url = url;
      this.title = title;
      this.author = author;
      this.ups = ups;
      this.postLink = postLink;
      this.subreddit = subreddit;
    }
  }
  class MemeService {
    async getMemes(): Promise<Meme[]> {
      const response = await fetch("https://meme-api.herokuapp.com/gimme");
      return await response.json();
    }
  }
  // two fns to set and get images from localstorage
  const setImgInStore = (
    imgData: {
      url: string;
      title: string;
      author: string;
      ups: number;
      postLink: string;
      subreddit: string;
    }[]
  ) => {
    localStorage.setItem("prevImg", JSON.stringify(imgData));
  };
  const getImgFromStore = () => {
    const prevImg = localStorage.getItem("prevImg");
    if (prevImg) return JSON.parse(prevImg);
  };
  let apiClient = new MemeService();
  const fetchImage = apiClient.getMemes();
  const handleNextBtnClick = () => {
    visitedMemes.push(currentMeme);
    //2. save that object to the local storage.
    setImgInStore(visitedMemes);
    //3. get the next img
    apiClient.getMemes().then((meme) => {
      console.log("next btn is clicked");
      currentMeme = meme;
    });
  };
  const handlePreviousBtnClick = () => {
    // only allow until the stack is available
    const prevImgs = getImgFromStore();
    if (prevImgs.length < 1) return;
    console.log("prev btn is clicked");
    // get the first object from array...
    let prevImg = prevImgs.pop();
    // setback the local storage to modified array
    setImgInStore(prevImgs);
    currentMeme = prevImg;
  };
  $: memeFetch = fetchImage;
  $: currentMeme = null;
</script>

<div class="container">
  {#await memeFetch}
    <p>Getting you top quality Meme!</p>
  {:then data}
    <MemeContainer data={currentMeme ? currentMeme : data} />
  {:catch}
    <p>Something went wrong!</p>
  {/await}
  <div class="button-stack">
    <button class="btn previous-btn" on:click={handlePreviousBtnClick}>
      &xlarr
    </button>
    <button class="btn next-btn" on:click={handleNextBtnClick}>&rarr</button>
  </div>
  <a href="https://github.com/version0chiro/VS-Meme-Reddit">
    <footer>If you like the project please consider ⭐staring the repo!</footer>
  </a>
</div>

<!-- svelte-ignore missing-declaration -->
<style>
  @font-face {
    font-family: "Gelasio";
    font-style: normal;
    font-weight: 400;
    src: local("Gelasio Regular"), local("Gelasio-Regular"),
      url(https://fonts.gstatic.com/s/gelasio/v1/cIf9MaFfvUQxTTqS9C6hYQ.woff2)
        format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
  }
  .container {
    position: relative;
    height: 100vh;
  }
  footer {
    position: absolute;
    bottom: 1vh;
    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
    text-align: center;
    margin-top: 10px;
    width: 100%;
    border: 3px solid #c15111;
  }
  img {
    border: 1px solid;
    border-color: aquamarine;
    width: 200%;
    max-height: 75vh;
  }
  .button-stack {
    display: flex;
    flex-direction: row;
    justify-content: center;
    position: absolute;
    bottom: 12vh;
    width: 100%;
  }
  .btn {
    flex: 1;
    border: none;
    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
    width: 100%;
    margin: 5px;
    text-align: center;
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    border-radius: 15px;
    outline: none;
  }
  .btn:hover {
    background-color: orange;
  }
  .btn:focus {
    background-color: rgb(255, 106, 0);
  }
</style>
