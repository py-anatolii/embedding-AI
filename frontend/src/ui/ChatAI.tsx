"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import styles from "./styles.module.css"; // Import your CSS module

const { TextArea } = Input;

const ChatAI: React.FC = () => {
  const [showList, setShowList] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  const toggleModelList = () => {
    setShowList(!showList);
  };

  const handleResize = () => {
    if (window.innerWidth < 768) {
      setIsSmallScreen(true);
      setShowList(false);
    } else {
      setShowList(true);
      setIsSmallScreen(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const router = useRouter();

  const createModel = () => {
    router.push("/create_model");
  };

  return (
    <div className={styles.chatAi}>
      {showList && (
        <div
          className={
            isSmallScreen ? styles.chatAiModelListModal : styles.chatAiModelList
          }
        >
          <Button
            className={styles.chatAiModelCreateButton}
            shape="round"
            onClick={createModel}
          >
            Create Model
          </Button>
          <hr />
          <ul className={styles.ModelLists}>
            <li>
              <Button className={styles.chatAiModelListItem} shape="round">
                Model 1
              </Button>
            </li>
            <li>
              <Button className={styles.chatAiModelListItem} shape="round">
                Model 2
              </Button>
            </li>
          </ul>
        </div>
      )}
      <div className={styles.chatAiContent}>
        <div className={styles.chatAiMessageTitle}>
          {isSmallScreen && (
            <div className={styles.chatAiIcon} onClick={toggleModelList}>
              <MenuOutlined />
            </div>
          )}
          <div className={styles.modelName}>model name </div>
          <div className={styles.profile}>profile</div>
        </div>
        <div className={styles.chatAiMessageList}>message content</div>
        <div className={styles.chatAiMessageInput}>
          <TextArea
            rows={1}
            size="large"
            placeholder="chat with personal ai"
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
          <Button size="large">Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatAI;
