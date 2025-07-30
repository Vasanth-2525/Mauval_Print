import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isOrderSidebarOpen, setOrderSidebarOpen] = useState(false);

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setLoggedIn(docSnap.data());
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const cartRef = collection(db, "users", user.uid, "cart");
      const wishlistRef = collection(db, "users", user.uid, "wishlist");

      const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCart(items);
      });

      const unsubscribeWishlist = onSnapshot(wishlistRef, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWishlist(items);
      });

      return () => {
        unsubscribeCart();
        unsubscribeWishlist();
      };
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const normalProducts = productList.filter((p) => p.ourDesign === false);
        const designProducts = productList.filter((p) => p.ourDesign === true);
        setProducts(normalProducts);
        setDesigns(designProducts);
      },
      (error) => {
        console.error("Error listening to products:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reviews"),
      (snapshot) => {
        const reviewList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewList);
      },
      (error) => {
        console.error("Error listening to reviews:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const setLoggedIn = (u) => {
    if (u) {
      setUser(u);
      window.dispatchEvent(new Event("login"));
    } else {
      setUser(null);
      window.dispatchEvent(new Event("logout"));
      toast.info("Logged out");
    }
  };

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (userDoc.exists()) {
      setLoggedIn(userDoc.data());
    } else {
      throw new Error("User not found in database");
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const isAdmin = firebaseUser.email === "vasanthlogan2525@gmail.com";
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    let userData = {
      uid: firebaseUser.uid,
      username: firebaseUser.displayName.replace(/\s+/g, "_").toLowerCase(),
      fullName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || "",
      role: isAdmin ? "admin" : "user",
      provider: "google",
      createdAt: new Date().toISOString(),
    };

    if (!snap.exists()) {
      await setDoc(userRef, userData);
    } else {
      userData = snap.data();
    }

    setLoggedIn(userData);
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent");
    } catch (error) {
      console.error(error);
      toast.error("Error sending password reset email");
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setLoggedIn(null);
  };

  const addToCart = async (product, quantity = 1) => {
    if (!user) return toast.error("Login required");

    const cartRef = doc(db, "users", user.uid, "cart", product.id);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const existingItem = cartSnap.data();
      const updatedQty = existingItem.quantity + quantity;
      await setDoc(cartRef, {
        ...existingItem,
        quantity: updatedQty,
      });
      toast.success("Cart updated");
    } else {
      const newItem = {
        ...product,
        images: product.images ?? [],
        price: product.salePrice ?? 0,
        quantity,
      };
      await setDoc(cartRef, newItem);
      toast.success("Added to cart");
    }
  };

  const removeFromCart = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    toast.info("Removed from cart");
  };

  const updateQuantity = async (id, size, qty) => {
    if (!user) return;
    const item = cart.find(
      (item) => item.id === id && item.selectedSize === size
    );
    if (item) {
      await setDoc(doc(db, "users", user.uid, "cart", id), {
        ...item,
        quantity: qty,
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const snapshot = await getDocs(collection(db, "users", user.uid, "cart"));

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );
    await Promise.all(deletePromises);

    // toast.info("Cart cleared");
  };

  const addToWishlist = async (product) => {
    if (!user) return toast.error("Login required");

    const wishlistRef = doc(db, "users", user.uid, "wishlist", product.id);
    const wishlistSnap = await getDoc(wishlistRef);

    if (wishlistSnap.exists()) {
      toast.info("Already in wishlist");
      return;
    }

    const newItem = {
      ...product,
      images: product.images ?? [],
      price: product.salePrice ?? 0,
    };

    await setDoc(wishlistRef, newItem);
    toast.success("Added to wishlist");
  };

  const removeFromWishlist = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "wishlist", id));
    toast.info("Removed from wishlist");
  };

  const clearWishlist = async () => {
    if (!user) return;
    const snapshot = await getDocs(
      collection(db, "users", user.uid, "wishlist")
    );
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });
    toast.info("Wishlist cleared");
  };

  const addAllWishlistToCart = async () => {
    if (!user) return;
    if (!wishlist.length) return toast.info("Wishlist is empty");
    for (let item of wishlist) {
      await addToCart(item);
    }
    toast.success("All wishlist items added to cart");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        registerUser: () => {},
        loginWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        designs,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        addAllWishlistToCart,
        isOrderSidebarOpen,
        setOrderSidebarOpen,
        reviews,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
