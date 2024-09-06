"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadOutlined } from "@ant-design/icons";
import { Input, Button, message, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import styles from './styles.module.css'; // Import your CSS module

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const CreateModel: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files[]", file as FileType);
    });
    setUploading(true);
    // You can use any AJAX library you like
    fetch("http://localhost:8000/", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then(() => {
        setFileList([]);
        message.success("upload successfully.");
      })
      .catch(() => {
        message.error("upload failed.");
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isAllowedType =
        file.type === "application/pdf" ||
        file.type === "application/vnd.ms-excel" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "text/csv";

      if (!isAllowedType) {
        message.error(
          `${file.name} is not a valid file. Only PDF, Excel, and CSV files are allowed.`
        );
        return Upload.LIST_IGNORE;
      }

      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  const createModel = () => {
    router.push("/chat_ai");
  };

  return (
    <div className={styles.createModel}>
      <div className={styles.createModelForm}>
        <div className={styles.registerKeyLabel}>
          Model Name:
        </div>
        <Input
          className={styles.registerKeyInput}
          size="large"
          placeholder="MODEL NAME, ex: sports_ai.."
          allowClear
        />
        <div className={styles.registerKeyLabel}>
          OpenAI Key:
        </div>
        <Input
          className={styles.registerKeyInput}
          size="large"
          placeholder="OPENAI KEY, ex: sk-osJvbgi5yT9lQQnV03X..."
          allowClear
        />
        <a
          href="https://platform.openai.com/api-keys"
          className={styles.registerKeyLink}
          target="_blank"
        >
          how to get API key?
        </a>
        <Upload {...props}>
          <Button
            icon={<UploadOutlined />}
            className={styles.uploadFileSelectButton}
            type="primary"
            size="large"
          >
            Select File
          </Button>
        </Upload>
        <Button
          className={styles.uploadFileUploadButton}
          type="primary"
          size="large"
          onClick={createModel}
          disabled={fileList.length === 0}
          loading={uploading}
          style={{ marginTop: 16 }}
        >
          {uploading ? "Uploading" : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default CreateModel;
