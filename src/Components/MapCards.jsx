import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { red } from "@mui/material/colors";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  ref,
  push,
  set,
  remove,
  update,
  off,
} from "firebase/database";
import { database, storage } from "../Components/FirebaseConfig";
import Planner from "./Planner";

//save favourites key
const DB_FAVOURITES_KEY = "favourites";

//mui color red reference
const theme = createTheme({
  palette: {
    primary: red,
  },
});

export default function MapCards({ places, uid }) {
  //holds information on all places returned from recommendation form
  const [recommendation, setRecommendation] = useState(places);
  //holds information on saved places
  const [favPlaces, setFavPlaces] = useState([]);

  //define and create the firebase RealTimeDatabase  reference
  const favouriteListRef = ref(database, uid + "/" + DB_FAVOURITES_KEY);

  //retrieves the specific recommendation --> add to firebase
  const saveToFavs = (index) => {
    console.log(recommendation[index]);
    const place = recommendation[index];
    const newFavouriteRef = push(favouriteListRef);
    set(newFavouriteRef, {
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      uuid: place.uuid,
    });
  };

  //deletes specific recommendation using data, which is key
  const deleteSavedFav = (data) => {
    console.log(`delete ${data}`);
    remove(ref(database, DB_FAVOURITES_KEY + "/" + data));
  };

  useEffect(() => {
    // onChildAdded will return data for every child at the reference and every subsequent new child
    onChildAdded(favouriteListRef, (data) =>
      setFavPlaces((prev) => [...prev, { key: data.key, val: data.val() }])
    );
    onChildRemoved(favouriteListRef, (data) =>
      setFavPlaces((prev) => prev.filter((item) => item.key !== data.key))
    );
    onChildChanged(favouriteListRef, (data) =>
      setFavPlaces((prev) =>
        prev.map((item) =>
          item.key === data.key ? { key: data.key, val: data.val() } : item
        )
      )
    );
    return () => off(favouriteListRef);
  }, []);

  //renders list of all saved places regardless of category
  const favPlacesListItems = (places) => {
    console.log("reached favplaces func");
    if (places.length > 0) {
      return places.map((place, index) => (
        <Card key={place.key}>
          <CardHeader title={place.val.name} />
          <CardContent>
            <p>{place.val.address}</p>
            <IconButton
              aria-label="add to favorites"
              color="primary"
              onClick={() => deleteSavedFav(favPlaces[index].key)}
            >
              <FavoriteIcon />
            </IconButton>
          </CardContent>
        </Card>
      ));
    }
  };

  //vary button function and color based on if place is included as favourite
  const varyButton = (place, index) => {
    const favoritePlace = favPlaces.find(
      (favPlace) => place.uuid === favPlace.val.uuid
    );
    return (
      <IconButton
        aria-label="add to favorites"
        color={favoritePlace ? "primary" : "default"}
        onClick={() =>
          favoritePlace ? deleteSavedFav(favoritePlace.key) : saveToFavs(index)
        }
      >
        <FavoriteIcon />
      </IconButton>
    );
  };

  return (
    <div>
      <ThemeProvider theme={theme}>
        {places.map((place, index) => (
          <Card key={place.uuid}>
            <CardHeader title={place.name} />
            <CardContent>
              <p>{place.address}</p>
            </CardContent>
            <CardActions>{varyButton(place, index)}</CardActions>
          </Card>
        ))}
        {favPlaces ? <h2>Favourites</h2> : null}
        {favPlaces ? favPlacesListItems(favPlaces) : null}
        <Planner places={favPlaces} />
      </ThemeProvider>
    </div>
  );
}
