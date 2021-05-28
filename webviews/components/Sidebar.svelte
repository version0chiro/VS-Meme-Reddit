<script>
  import AppTitle from "./AppTitle.svelte";
  import ImgContainer from "./ImgContainer.svelte";
  import Buttons from "./Buttons.svelte";
  import Footer from "./Footer.svelte";
  import { onMount } from "svelte";

  let imgData = {}; // holds the current image info.
  let visitedMemes = []; // local store to hold visited memes
  let loading = false; // to show image or loading text...

  // Api call and state updation..
  const fetchImgFromAPI = async () => {
    const imgElement = document.querySelector(".img-meme");
    // check if image is rendered or not...
    if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
      // update the array with unique entries.
      if (!visitedMemes.find((m) => m.url === imgData.url)) {
        visitedMemes.push({ url: imgData.url, title: imgData.title });
      }
    }
    loading = true;
    // call api and up on resolving the promise fill the data and reset the flag to load
    await fetch("https://meme-api.herokuapp.com/gimme")
      .then((res) => res.json())
      .then((data) => {
        imgData = data;
        loading = false;
        // console.log(data);
      });
  };

  // upon first app load, call api to fetch an image.
  onMount(fetchImgFromAPI);

  const fetchNextImg = () => {
    // console.log("fetch next image is called", visitedMemes);

    // call api and update state
    fetchImgFromAPI();

    // enable prev button since atleast one item to show
    let prevBtn = document.querySelector(".prev-btn-disabled");
    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.classList.remove("prev-btn-disabled");
    }
  };

  // Previous button click...
  const fetchPreviousImg = () => {
    if (visitedMemes.length < 1) {
      let prevBtn = document.querySelector(".btn-prev");
      if (prevBtn) {
        prevBtn.classList.add("prev-btn-disabled");
        prevBtn.disabled = true;
      }
      return;
    }
    imgData = visitedMemes.pop();
  };
</script>

<AppTitle />
<main>
  {#if loading}
    <p>hold on buddy... getting you an awesome meme...</p>{:else}
    <ImgContainer imgUrl={imgData.url} imgTitle={imgData.title} />
  {/if}
</main>
<Buttons on:onClickNext={fetchNextImg} on:onClickPrevious={fetchPreviousImg} />
<Footer />

<style>
  main {
    position: absolute;
    top: 10vh;
    text-align: center;
    max-width: 100%;
    padding: 10px;
  }
</style>
